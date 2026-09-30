// What people say. Each entry is a function (game, npc) -> lines; lines may branch with choices.
// Line: { who?, text, mood?, choices?: [{ text, next, action }], goto?, end? }
const L = (text, o = {}) => ({ text, ...o });
const night = (g) => g.clock.night;
const hasLetter = (g) => g.player.inv.has('letter');

const SELL = { text: 'Sell my loot.', next: 1, action: (G) => G.story.sell() };
const RUMORS = [
  ['They say a witch keeps a hut on stilts in the Mirewood, and sells cures for what ails a thief.', 'Witch\'s Hut'], ['A bandit chief called Red Cael has a camp west of the Old Road. Fat purses, thin patience.', 'Bandit Camp'],
  ['Cinderwick burned three years back. Something walks the ash at night. Not the villagers.', 'Cinderwick'], ['The Greywater toll house holds a strongbox and a captain who loves his key.', 'Greywater Bridge'],
  ['An old tower in the Mirewood has a cache in it. Nobody who went to fetch it has come back to talk about it.', 'Ruined Tower'], ['Under the swamp there is a shrine to a drowned saint. Drowned saints keep gifts.', 'Sunken Shrine'],
  ['The hunter Wulf hates the bandits. Do him a kindness and he will pay.', 'Hunter\'s Lodge'], ['The gallows on the hill are never empty. Never. Do not look up at night.', 'Hangman\'s Hill'],
];
export const rumor = (g) => { const r = RUMORS[Math.floor(Math.random() * RUMORS.length)]; return { text: r[0], place: r[1] }; };
export const DIALOGUE = {
  gateguard: (g) => night(g)
    ? [L('Gates are barred till dawn. Captain\'s orders, and I like my head where it is.'), L('Whatever you\'re selling, sell it in the morning.', { end: true })]
    : [L('Ashgate is open till the tenth bell. Wipe your boots and keep your hands where I can see them.'), L('And if you hear singing from the crypt after dark... you heard nothing.', { end: true })],
  keepgateguard: () => [L('Ravenspire is closed to all but the Duke\'s household.'), L('Go home, friend. Nobody goes up that hill on purpose anymore.', { end: true })],
  harl: () => [L('You should not be in here.', { mood: 'anger' }), L('...', { end: true })],
  gorm: (g) => [
    L(`Evenin'. Mead's a copper, ale's two, and the stew is a mystery. What'll it be?`, { choices: [
      { text: 'What\'s the news in Ashgate?', next: 1 }, { text: 'Tell me about the Duke.', next: 2 }, { text: 'Nothing. Just looking.', next: 'end' }] }),
    L('Bell\'s been tolling wrong for a month. Tolls thirteen when it should toll twelve. The sexton swears it\'s the wind. The sexton also swears he\'s never seen a ghost, and he lives in a graveyard.', { goto: 0 }),
    L('Duke Aldric Vorst. Pale as candle wax since the plague took his boy. He sleeps up in the tower room, behind two guards and a locked door. Sensible man. Terrified man. Same thing.', { goto: 0 }),
  ],
  drunk1: () => [L('*hic* ...have you seen my goat? No? Neither has the goat.'), L('Watch the shadows by the well, friend. They\'re getting longer. On their own.', { end: true })],
  merc: (g) => [L('Move along, hood. I\'m paid to drink here, and I\'m very good at my job. ...Fancy a throw of the bones? Two dice, high roll wins.', { mood: 'anger', choices: [
      { text: 'Bet 5 gold.', next: 1, action: (G) => G.story.dice(5) }, { text: 'Bet 20 gold.', next: 1, action: (G) => G.story.dice(20) }, { text: 'Not today.', next: 2 }] }),
    L('The dice clatter across the table.', { onShow: (G) => G.story.diceReport(), goto: 0 }),
    L('Word of advice: don\'t whistle in the graveyard. Something whistles back.', { end: true })],
  bard: (g) => [L(`♪ "...and the Duke went up to Ravenspire, and the Duke came down no more..." ♪`, { choices: [{ text: 'Play me a tune.', next: 1, action: (G) => G.sfx.lute?.() }, { text: 'Tell me a rumor.', next: 2 }, { text: 'Enough.', next: 3 }] }), L('♪ ♪ ♪', { goto: 0 }), (() => { const r = rumor(g); return L(r.text, { onShow: (G) => G.story.reveal(r.place), goto: 0 }); })(), L('Ah, a listener. A rarity. Do you know the ending? Nobody does. That\'s why it\'s so popular.', { end: true })],
  smith: (g) => [L('Careful of the sparks. Or don\'t. I\'ve stopped caring.', { choices: [SELL, { text: 'Just talking.', next: 2 }] }), L('Done. Coin for the shiny, no questions asked.', { goto: 0 }), L('Yes, I buy steel, and I ask no questions. Mostly because the answers are always the same.', { end: true })],
  hilde: () => [L('Bread\'s from this morning, stranger. Nothing else is guaranteed.'), L('If you\'re hungry, there\'s a loaf on the table. If you\'re thieving, there\'s a loaf on the table. Either way, leave a coin.', { end: true })],
  osric: () => [L('Barrels, buckets, coffins. Three trades, one shop.'), L('People used to buy barrels. Now they order coffins by the dozen.', { end: true })],
  marta: (g) => {
    const f = g.story.flags;
    if (f.locketReturned) return [L('You brought my girl\'s face back to me. I cannot repay you. Take this - and take my warning: the Duke\'s sleeping key hangs in his study desk, not on his neck.', { end: true })];
    if (g.player.inv.has('locket')) return [L('That locket...! That is my Lysa\'s locket!', { mood: 'fear' }), L('Where did you find it? No. No, I don\'t care. Please. Give it to me.', { choices: [{ text: 'Give her the locket.', next: 2, action: (G) => G.story.giveLocket() }, { text: 'Keep it. (Walk away.)', next: 'end' }] }), L('Bless you. Bless you.', { end: true })];
    if (f.locketQuest) return [L('Have you found it? A silver locket with a raven on the lid. A drunk mercenary took it. Probably pawned it to the smith.', { end: true })];
    return [L('You have kind eyes, for a hood. Might I ask something of you?', { choices: [{ text: 'What do you need?', next: 1 }, { text: 'Not now.', next: 'end' }] }),
      L('My daughter\'s locket. Stolen at the tavern by a mercenary, three nights past. It is all I have of her since the fever. If you were to find it... I have little, but I would pay.', { choices: [{ text: 'I\'ll look for it.', next: 'end', action: (G) => G.story.startLocket() }, { text: 'Sorry, widow.', next: 'end' }] })];
  },
  ansel: (g) => {
    const f = g.story.flags;
    if (f.relicReturned) return [L('The Saint\'s tear is home. You have done a holy thing, thief. Go carefully.', { end: true })];
    if (g.player.inv.has('gem') && f.relicQuest) return [L('Is that...? The Pale Saint\'s tear? From the crypt?', { mood: 'fear' }), L('Give it to me, child. Let it lie on the altar again.', { choices: [{ text: 'Hand over the gem.', next: 2, action: (G) => G.story.giveRelic() }, { text: 'I\'ll keep it.', next: 'end' }] }), L('The saint\'s peace on you. Take this key: the mausoleum door will open for you now, and the dead within will not hold it against you.', { end: true })];
    return [L('The Pale Saint watches over Ashgate. She has been very quiet lately.'), L('There is a relic in the crypt below, a tear of her grief, cut as a gem. I dare not go down. If you were to bring it back... you would have my gratitude. And my key.', { choices: [{ text: 'I\'ll see what I can do.', next: 'end', action: (G) => G.story.startRelic() }, { text: 'Not my concern.', next: 'end' }] })];
  },
  tobbe: () => [L('Shh! You hear it? No? Good. Keep it that way.', { mood: 'fear' }), L('I bury them deep, hooded one. But lately they don\'t stay buried.', { end: true })],
  merchant: (g) => night(g) ? [L('Closing up. Come back at sunup.', { end: true })] : [L('Fresh as they come, stranger. Well... fresh-ish.'), L('Stalls close at the eighth bell. After that the market belongs to the rats.', { end: true })],
  peasant: (g) => { const r = rumor(g); return [L('Curfew\'s coming. I\'d be indoors if I were you.', { choices: [{ text: 'Heard any rumors?', next: 1 }, { text: 'Good night.', next: 'end' }] }), L(r.text, { onShow: (G) => G.story.reveal(r.place), end: true })]; },
  peasant_old: (g) => [[L('Curfew\'s coming. I\'d be indoors if I were you.'), L('The watch is short-tempered these days. They say the Duke is afraid of his own shadow.', { end: true })], [L('Do you hear that ringing? No? Then I must be mad.'), L('Best I go home.', { end: true })]][Math.floor(Math.random() * 2)],
  beggar: () => [L('A copper for a man who has seen things?'), L('I saw them carry the boy\'s coffin up the hill. Very light, it was. Suspiciously light.', { end: true })],
  cook: () => [L('If you steal my bread, I will know. I always know.'), L('The Duke eats nothing but broth now. Broth! From my kitchen! Such a waste.', { end: true })],
  maid: () => [L('I only sweep. I don\'t see anything. I don\'t hear anything.', { mood: 'fear' }), L('...The Duke walks at night. Down to the cellar, and he doesn\'t come back up the same way.', { end: true })],
  steward: () => [L('The Duke is not to be disturbed. By anyone. By anything.', { mood: 'anger' }), L('Who let you in? Guards!', { end: true })],
  duke: () => [L('Please... please, no...', { mood: 'fear', end: true })],
  tolliver: () => [L('Worked this land thirty years. Never seen it so quiet. Birds have gone. Even the crows have gone.'), L('If you are heading to Ashgate, do not take the western trail after dark.', { end: true })],
  maren: () => [L('Tolliver worries. I bake. It is how we cope.'), L('There is stew if you are hungry. Do not tell Tolliver I fed a stranger.', { end: true })],
  farmhand: () => [[L('Turnips. Always turnips. I dreamed of turnips last night, and they were looking at me.'), L('Back to work.', { end: true })], [L('Boss says the bandits took the harvest money. I say the boss hid it in the well.'), L('Do not repeat that.', { end: true })]][Math.floor(Math.random() * 2)],
  bosk: () => [L('Greywater Bridge. Toll is a silver a head, two for a wagon. Are you a head or a wagon?'), L('Do not answer. Do not touch my desk. Move along.', { end: true })],
  tollguard: () => [L('Nothing crosses without paying. Nothing.'), L('Not even ghosts. Especially not ghosts.', { end: true })],
  gil: (g) => [
    L('Gil, at your service. Anything you need, I have for a price. Anything you do not need, I have double.', { choices: [
      { text: 'Buy a lockpick (10 gold)', next: 1, action: (G) => G.story.buy('lockpick', 10) },
      { text: 'Buy Red Salve (28 gold)', next: 1, action: (G) => G.story.buy('potion', 28) },
      { text: 'Buy Hexbane draught (45 gold)', next: 1, action: (G) => G.story.buy('hexbane', 45) },
      { text: 'Buy an Ember Flask (32 gold)', next: 1, action: (G) => G.story.buy('ember', 32) },
      { text: 'Buy Throwing knives ×4 (24 gold)', next: 1, action: (G) => G.story.buy('knife', 24, 4) },
      SELL, { text: 'Just passing.', next: 'end' }] }),
    L('A pleasure. Anything else?', { goto: 0 }),
  ],
  pilgrim: () => [L('I walk from stone to stone. They say if you light all four, the road remembers you.'), L('I only made it to two. My knees light the rest.', { end: true })],
  hermit: () => [L('You can hear them if you press your ear to the rock. Old things, talking in their sleep.'), L('The letter you carry is not a letter. It is a sleeper. Do not wake it.', { end: true })],
  wulf: () => [L('Quiet. You scare the deer. Not that there are any deer anymore.'), L('The Mirewood has bandits to the west, a witch to the south-west, and something worse under the tower. Choose your poison.', { end: true })],
  sable: (g) => [
    L('Old Sable. Yes. The other Sable. Your Sable sends her regards, does she? Ha. She sends everything, that one.', { choices: [
      { text: 'Buy Hexbane draught (40 gold)', next: 1, action: (G) => G.story.buy('hexbane', 40) },
      { text: 'Buy an Ember Flask (30 gold)', next: 1, action: (G) => G.story.buy('ember', 30) },
      { text: 'Buy Red Salve (26 gold)', next: 1, action: (G) => G.story.buy('potion', 26) },
      { text: 'Buy Nightshade oil (35 gold)', next: 1, action: (G) => G.story.buy('poison', 35) },
      { text: 'Buy a Fire flask (38 gold)', next: 1, action: (G) => G.story.buy('firebomb', 38) },
      SELL, { text: 'Leave.', next: 'end' }] }),
    L('Take it. It is bitter, like everything worth having.', { goto: 0 }),
  ],
  ilse: (g) => g.story.flags.ilseTold ? [L('Go on. The bell tolls thirteen. You know what to do.', { end: true })] : [L('Do not go near the gallows hill. They hang the dead there, now.', { mood: 'fear' }), L('...Do not mind me. I have had a long night. Three years of night.', { end: true })],
  brannoch: (g) => {
    const s = g.story;
    return [L('Back for supplies? Sable\'s coin spends the same as anyone\'s.', { choices: [
      { text: 'Buy a lockpick (12 gold)', next: 1, action: (G) => G.story.buy('lockpick', 12) },
      { text: 'Buy Red Salve (30 gold)', next: 1, action: (G) => G.story.buy('potion', 30) },
      { text: 'Buy an Ember Flask (35 gold)', next: 1, action: (G) => G.story.buy('ember', 35) },
      { text: 'Buy a lead sap (30 gold)', next: 1, action: (G) => G.story.buy('sap', 30) },
      SELL, { text: 'Remind me of the job.', next: 2 }, { text: 'Never mind.', next: 'end' }] }),
      L('Pleasure doing business. Anything else?', { goto: 0 }),
      L('Ravenspire. The Duke\'s bedchamber, at the foot of his bed, a strongbox. A letter in black wax. Bring it out unopened. The gates shut at ten; the breach is west, the outfall east, and the crypt runs under the keep for those with a strong stomach.', { goto: 0 }),
    ];
  },
};
