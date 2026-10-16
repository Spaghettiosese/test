// The friendship web in action: an NPC-to-NPC overheard chat system (40 new chats in ordered pairs), ten multi-day
// town dramas Misa can mediate, letters from the future at 10 hearts, and the Friend Circle at five Best Friends.
import { register, get, all, features } from '../../core/registry.js';
import { sc, flag, mood, time, giveOr, seasonOf, dateOf } from '../social/util.js';
import { smallTalk } from '../social/talk.js';
import { bubble } from '../social/bubbles.js';
import { TILE } from '../../world/map.js';
import { stickers } from '../sv_life/state.js';
import { S, nameOf, ch3, CAST, bestFriends } from './core.js';
import { relOf } from './groups.js';

// ---------- overheard chats: [pair, [a, b], when, lines...]  '<' = first speaker, '>' = second ----------
const C = (a, b, ...chats) => chats.map((c, i) => ({ id: `sv3c_${a}_${b}_${i + 1}`, pair: `${a}-${b}`, a, b, n: i, when: c[0], lines: c.slice(1).map((l) => [l[0] === '<' ? a : b, l.slice(1)]) }));
export const CHATS = [
  ...C('kai', 'rina', [null, '<Hoshino, race you to the gate!', '>Running in the corridor is against the rules.', '<It is not a corridor. It is a fast hallway.'], ['weather:rain|storm', '>Tanabe, you tracked mud across the whole floor.', '<It is a map of my day! Very artistic.', '>It is a mop for your day.']),
  ...C('suzu', 'theo', [null, '<Do you want to read my draft?', '>Only if you look at my sketch.', '<...Deal. On three.'], ['season:autumn', '>Your last chapter had a sad lighthouse.', '<Your last drawing had a sad lighthouse.', '>We should stop being sad together.']),
  ...C('hina', 'goro', [null, '<Mr. Hayashi! There is a toad in your lettuce!', '>That is not a toad. That is my security guard.'], ['season:spring|summer', '>Your compost smells like victory.', '<It is a five-star beetle hotel!']),
  ...C('mika', 'sachiko', [null, '<Vanilla is up three yen, Sachiko.', '>It is not me, dear. It is the vanilla.', '<Of course it is.'], [null, '>I told everyone your latte art is lovely.', '<Really?', '>Do not let it go to your foam.']),
  ...C('hana', 'goro', [null, '<Hayashi, you dropped a card.', '>It is an ace up my sleeve, Mrs. Aoki.', '<Then I will see your ace.'], ['time>=15:00', '>Mrs. Aoki, I demand a rematch.', '<Tomorrow. I need my nap.', '>You always need your nap when you are winning.']),
  ...C('hana', 'sachiko', [null, '<Sachiko, did you hear about the cat?', '>Dear, I heard about the cat before the cat did.'], ['weekend', '>Remember when we skipped school for the festival?', '<We did not skip. We were "sick".']),
  ...C('kai', 'hina', [null, '<I caught a fish! A real one!', '>That is a boot, Kai.', '<A boot-shaped fish!'], ['season:summer', '>Kai, you are standing on a frog.', '<WHERE?', '>Under your left foot. He is fine. He is annoyed.']),
  ...C('rina', 'suzu', [null, '<Mori. Your pen is leaking.', '>It is a narrative device.', '<Hmph. Here, borrow mine.'], [null, '>Hoshino, I read your essay. It was beautiful.', '<...I never said you could.', '>It was on the desk.']),
  ...C('tobias', 'goro', [null, '<Hayashi, your fence is eleven degrees off level.', '>It is the ground that is off level.', '<The ground has no opinion.'], ['time>=16:00', '>Wren, your bishop is in danger.', '<It is a trap.', '>It has been a trap for an hour.']),
  ...C('jun', 'kai', [null, '<Kai, hold the rod like it is a bird.', '>A bird?', '<Gently. But do not let go.'], [null, '>Captain, why do you whistle at the sea?', '<Ha! She whistles back, boy. Listen.']),
  ...C('fujita', 'ogawa', [null, '<Ogawa, a pun for you. The energy in your gym is kinetic.', '>That was terrible!', '<Thank you.'], ['weekday', '>Fujita, your coffee is frightening.', '<So is your whistle.', '>Truce?', '<Never.']),
  ...C('fujita', 'rina', [null, '<Rina, when did you last take a break?', '>Breaks are for people who are finished.', '<Nobody is ever finished.'], [null, '>Ms. Fujita, may I have another study plan?', '<Yes. Item one: sleep.']),
  ...C('theo', 'kai', [null, '<Theo. Say something.', '>...Something.', '<Wow. Eloquent!'], ['weekend', '>Kai, you are in my light.', '<Sorry! Is this a good pose?', '>It is a terrible pose. Keep it.']),
  ...C('pip', 'kiko', [null, '<Kiko! I beat level nine!', '>Level nine has a secret door.', '<WHAT?! Where?!'], ['weather:rain|storm', '>Pip, why are you drenched?', '<The mail never sleeps!', '>The mail needs an umbrella.']),
  ...C('pip', 'sachiko', [null, '<Mrs. Ueda! Parcel for you!', '>Dear, you are a lifesaver. Take a biscuit.', '<I have seven already.'], [null, '>Pip, you took a wrong turn again.', '<It was a scenic turn!', '>It was Mr. Hayashi\'s kitchen.']),
  ...C('ogawa', 'goro', [null, '<Hayashi! My tomatoes are this big!', '>Mine are bigger. Yours are a rumour.', '<Harvest Market will tell!'], ['season:autumn', '>I am growing a tomato with a face.', '<A face?!', '>It is a very smug face.']),
  ...C('kiko', 'jun', [null, '<Captain, I have a charm for safe passage.', '>Does it work on gulls?', '<Gulls are beyond the kami.'], [null, '>Kiko, never whistle on a boat.', '<I know. I was whistling at the pudding.', '>That is the same rule.']),
  ...C('theo', 'hina', [null, '<Hina, hold still. I am drawing your beetle.', '>He is not a beetle. He is a stag beetle!', '<Fine. A very handsome stag.'], [null, '>Theo, can you draw me a snail?', '<It will take four minutes.', '>Snails are fast, Theo. Draw faster.']),
  ...C('rina', 'mika', [null, '<A strawberry shortcake. For studying.', '>Of course, dear! Studying is hungry work!', '<Hmph. It is purely academic.'], ['weekend', '>Rina, you are blushing.', '<It is the oven.', '>The oven is off.']),
  ...C('jun', 'tobias', [null, '<Toby, do you ever stop checking the time?', '>The time never stops checking me.', '<Philosopher.'], [null, '>Ishida, you are late.', '<The tide was late.', '>The tide is never late. You are the tide.']),
];
const state = { chat: null, cool: 6 };
register('worldTick', 'sv3_web_chats', {
  update(dt, world, game) {
    if (game.scenes.top !== world) return;
    const p = world.player, st = state;
    if (st.chat) {
      const c = st.chat;
      c.t -= dt;
      const a = world.npcs[c.a], b = world.npcs[c.b];
      if (!a || !b || !a.present || !b.present) { st.chat = null; return; }
      if (Math.hypot(a.x - p.x, a.y - p.y) < 6 * TILE) c.heard = true;
      if (c.t <= 0) {
        if (c.i >= c.lines.length) {
          if (c.heard) heard(game, c);
          st.chat = null; st.cool = 10; return;
        }
        const [who, text] = c.lines[c.i++], me = who === c.a ? a : b, other = who === c.a ? b : a;
        me.faceTo(other.x, other.y); other.faceTo(me.x, me.y);
        bubble(who, text, 2.9); c.t = 3.1;
      }
      return;
    }
    if ((st.cool -= dt) > 0) return;
    st.cool = 4;
    const here = world.presentNPCs().filter((n) => !n.moving && !n.path && Math.hypot(n.x - p.x, n.y - p.y) < 11 * TILE);
    const s = S(game);
    for (const c of CHATS) {
      const a = here.find((n) => n.id === c.a), b = here.find((n) => n.id === c.b);
      if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) > 7 * TILE) continue;
      if ((s.chats[c.pair] || 0) !== c.n || s.chatDay[c.pair] === game.day || (c.when && !game.check(c.when))) continue;
      s.chatDay[c.pair] = game.day;
      st.chat = { ...c, lines: c.lines, i: 0, t: 0.2, heard: false };
      return;
    }
  },
});
export function heard(game, c) {
  const s = S(game);
  if (c.n === (s.chats[c.pair] || 0)) s.chats[c.pair] = c.n + 1;
  smallTalk(game, c.a, 3); smallTalk(game, c.b, 3); game.stat('webChatsHeard');
  if (s.chats[c.pair] >= 2) {
    game.toast(`You know the story of ${nameOf(c.a)} and ${nameOf(c.b)}!`, 'heart');
    smallTalk(game, c.a, 5); smallTalk(game, c.b, 5);
  }
}
export const webStars = (g, pair) => Math.min(2, S(g).chats[pair] || 0);

// ---------- town dramas ----------
// Each drama: A tells their side (day 1), B tells theirs (a later day), then Misa mediates with both (a later day).
const DR = (o) => o;
export const DRAMAS = [
  DR({ id: 'buns', a: 'mika', b: 'sachiko', title: 'The Bun War', mail: 'Misa, do you have a minute? It is about the mart. And buns. Cafe Kumo, please.',
    s1: ['sad|Sachiko started selling melon buns at the mart. MY melon buns. Same recipe. I swear it.', 'I do not want a war. I just want her to ask first.'], o1: [['Say Sachiko might not know', 'Mm. Maybe. She does not usually copy. It just stung.', 15], ['Tell her to bake a better bun', 'happy|Ha! Yes! A more fluffy bun! Take that, kind neighbour!', 10], ['Offer to talk to Sachiko', 'happy|Would you? Oh, thank you. Be gentle.', 20]],
    s2: ['sad|Dear, Mika thinks I copied her? I found that recipe in my late husband\'s book. It is a Ueda family bun!', 'I would never steal. I would just borrow loudly.'], o2: [['Say Mika is upset but kind', 'Hm. I suppose I should have told her. I got carried away.', 15], ['Say it sounds like the same recipe', 'Oh dear. They might be cousins. The buns, I mean. Oh dear.', 10], ['Say you will help fix it', 'happy|Bless you, dear. Bring Mika tomorrow. I will bring tea.', 20]],
    m: ['@Mika and Sachiko stand on either side of the mart counter with one plate of melon buns between them.'], mo: [['Suggest a joint Melon Bun Day', 'happy|A joint day? Cafe Kumo buns plus Sunny Mart buns? Oh!', 'happy|Fine, dear. Fifty-fifty. And I get to name it.', 'both'], ['Back Mika\'s recipe', 'happy|Thank you, Misa! I knew it was mine!', 'sad|Hmph. I suppose it is. Fine.', 'a'], ['Back Sachiko\'s recipe', 'sad|Oh. I see.', 'happy|Finally, someone with taste, dear!', 'b']],
    end: ['@The two shopkeepers share the first bun. Neither will admit whose it was.'], reward: { item: 'snack_melon_bread', coins: 120 } }),
  DR({ id: 'notes', a: 'kai', b: 'rina', title: 'Borrowed Notes', mail: 'Yo Misa! Quick! I need advice. About Rina. Meet me in the corridor!',
    s1: ['sad|I borrowed Rina\'s notes for the test. And I may have spilled ramen on them. A lot of ramen.', 'She does not know yet. She is going to explode. In a polite way.'], o1: [['Tell him to confess', 'happy|You are right. Honesty. Like a team captain. I can do this.', 20], ['Offer to rewrite the page', 'happy|You would? Misa, you are an angel! A noodle-proof angel!', 10], ['Say Rina will survive', 'surprised|Will she? You have not seen her face when a pen goes missing.', 5]],
    s2: ['neutral|Tanabe returned my notes. They smell of broth and shame. Page eleven is unreadable.', 'sad|I spent two weeks on that page. I do not know whether to be angry or to laugh.'], o2: [['Say he is sorry', 'neutral|He did look sorry. Like a dog caught on the sofa. Hm.', 15], ['Say he was trying to study', 'neutral|Trying. That is a start. I suppose even Tanabe deserves a chance.', 10], ['Offer to help re-copy', 'happy|You would help? That is... generous. Thank you.', 20]],
    m: ['@Kai and Rina meet at the school gate. Kai holds a lunchbox like a shield.'], mo: [['Have them rewrite the page together', 'happy|Together? Okay! I will write, she will correct. We will be a team!', 'happy|Fine. But I choose the pen. And the seat. And the colour of the ink.', 'both'], ['Back Kai: it was an accident', 'happy|THANK YOU! See, Rina? An accident!', 'sad|An accident that has stained my best page.', 'a'], ['Back Rina: he should repay her', 'sad|Okay. I will buy her a new notebook. A noodle-proof one.', 'happy|Acceptable.', 'b']],
    end: ['@The new page is full of coloured pens, corrections and one small ramen doodle in the corner.'], reward: { item: 'gift_cute_stationery', coins: 100 } }),
  DR({ id: 'mural', a: 'theo', b: 'suzu', title: 'Whose Story Is It?', mail: 'Hi. It is Theo. Can we talk at the harbour mural. It is not urgent. It is a bit urgent.',
    s1: ['sad|I drew a girl for the mural. She looks like a character from Suzu\'s story. I did not ask. I did not mean to.', 'Now I do not know how to tell her.'], o1: [['Say it is okay to ask', 'neutral|Yeah. Asking. I should have just asked.', 15], ['Say fans copy all the time', 'sad|Not helpful, Misa. Not helpful.', 5], ['Offer to help him tell her', 'neutral|...Please. I will pay you in sketches.', 20]],
    s2: ['sad|I found out Theo drew my heroine on the mural. I... I was very upset. For ten minutes. Then I was very proud.', 'neutral|But I wanted him to ask. Do you understand?'], o2: [['Say he is shy about it', 'neutral|He is. I know. That is why it is hard to stay angry.', 15], ['Say it is a compliment', 'happy|It is. It really is. Don\'t tell him I cried.', 10], ['Suggest they talk', 'neutral|Yes. Talk. Not text. Face to face. With paper.', 20]],
    m: ['@Theo and Suzu stand in front of the harbour mural. A tiny figure with a satchel and a cat looks back at them.'], mo: [['Suggest they make a sequel together', 'happy|A sequel? The mural with a story panel? ...I would like that.', 'happy|Co-authors! A mural and a book! That is the best idea ever.', 'both'], ['Support Theo: art belongs to all', 'happy|Thank you. I will always ask first from now on.', 'sad|I suppose... but ask first.', 'a'], ['Support Suzu: ask before you borrow', 'sad|You are right. I am sorry.', 'happy|Apology accepted. And forgiven.', 'b']],
    end: ['@Under the little satchel girl, Theo paints a tiny caption: story by S. Mori. She sniffs and pretends it is the sea breeze.'], reward: { item: 'gift_star_sketch', coins: 100 } }),
  DR({ id: 'frogs', a: 'hina', b: 'goro', title: 'The Missing Seedlings', mail: 'Misa!! Emergency!! Meet me at Mr. Hayashi\'s fence. It is about frogs. And possibly tomatoes.',
    s1: ['surprised|My frogs got into Mr. Hayashi\'s tomato bed! They ate a few slugs. They also sat on the seedlings. Flat. Forty.', 'He is going to be SO mad.'], o1: [['Say the slugs were a gift', 'happy|They were! Frogs are garden heroes! Do you think he will see it that way?', 10], ['Say apologise first', 'sad|Yes. Yes. A big apology. With a bug.', 20], ['Offer to help replant', 'happy|YES. Teamwork! Seeds! Soil! Frogs on guard duty!', 15]],
    s2: ['neutral|Forty seedlings. Squashed. Hmph. The little menace and her frogs. I could not even be angry. They looked so proud.', 'I would never tell her. But I miss the squishy sound of them hopping around the beds.'], o2: [['Say Hina is sorry', 'neutral|She is. She left me a jar of beetles as an apology. A jar. Of beetles.', 15], ['Say the frogs mean well', 'neutral|They do. They are a very enthusiastic security team.', 10], ['Suggest a truce', 'neutral|A truce. With a frog pond in the corner. Hm. That is not terrible.', 20]],
    m: ['@Hina and Goro stand at the garden fence. Between them, a tray of bare earth. Daifuku sits at Goro\'s feet, judging.'], mo: [['Build a frog pond bed together', 'happy|A pond in the corner! The frogs get a home, and the tomatoes get peace!', 'neutral|Fine. But the frogs follow the fence rules.', 'both'], ['Back Hina: frogs are heroes', 'happy|YES. Frogs are the best!', 'sad|Hmph. I will fence them out.', 'a'], ['Back Goro: respect the beds', 'sad|Okay. No frogs in the beds.', 'neutral|Good. Agreed.', 'b']],
    end: ['@A tiny pond appears at the edge of the tomato bed, with a stone for sunbathing. The first frog arrives within the hour.'], reward: { item: 'seed_tomato', coins: 100 } }),
  DR({ id: 'clock', a: 'tobias', b: 'jun', title: 'The Boat Clock', mail: 'Aoki. A matter of precision. The Sayori\'s clock. Please visit the shop. T.W.',
    s1: ['neutral|Ishida brought me the Sayori\'s clock. It runs seven minutes slow. I fixed it. He says it is now WRONG.', 'Seven minutes. He has used it for forty years.'], o1: [['Say it is seven minutes of sentiment', 'neutral|Sentiment is not a measurable unit. ...Hm. But I see your point.', 15], ['Say Jun trusts his clock', 'neutral|Trust is a poor unit of time. But go on.', 10], ['Offer to talk to Jun', 'neutral|Do. Quietly. He is a stubborn old sailor.', 20]],
    s2: ['sad|Toby fixed my boat clock. Now it ticks right. Right is wrong. The sea runs seven minutes slow, kid. Always has.', 'My crew set that clock. It was theirs.'], o2: [['Say Tobias meant well', 'neutral|Aye. He did. He never means anything but well. It is infuriating.', 15], ['Say seven minutes is a memory', 'sad|Aye. That is it. A memory. A seven-minute memory.', 20], ['Say get a second clock', 'happy|A second clock! One for the sea, one for the shore! Ha!', 10]],
    m: ['@Tobias and Jun stand on the pier with the Sayori\'s brass clock between them. The sea laps gently.'], mo: [['Set the clock to both times', 'neutral|Two hands. Sea time and shore time. ...Efficient.', 'happy|Ha! Two times! The way it should be!', 'both'], ['Keep it seven minutes slow', 'happy|Thank you, kid.', 'neutral|...Tolerated. Under protest.', 'b'], ['Reset it to correct time', 'neutral|Correct is correct.', 'sad|...Aye. If you say so.', 'a']],
    end: ['@Tobias engraves a tiny second dial. Jun polishes it with his sleeve, whistling, then stops, remembering the rule.'], reward: { item: 'gift_watch_chain', coins: 120 } }),
  DR({ id: 'tele', a: 'ogawa', b: 'fujita', title: 'Tomatoes vs Telescope', mail: 'AOKI! EMERGENCY! The greenhouse! Come at once! Bring water, not a coat!',
    s1: ['surprised|Fujita wants to put the club telescope on the greenhouse roof! The ROOF! My tomatoes need the sun!', 'sad|And she says it is for science. SCIENCE! Tomatoes are science too!'], o1: [['Say tomatoes matter too', 'happy|Thank you, Aoki! At last, an ally!', 15], ['Say stars are far away', 'neutral|Hm. They are. But so is next week\'s harvest.', 5], ['Offer to find a compromise', 'happy|A compromise! Yes! Possibly a hat for the telescope!', 20]],
    s2: ['neutral|The greenhouse roof is the only spot with clear sky above the school. Ogawa wants it for tomatoes. I want it for Saturn.', 'sad|Saturn is not available for rescheduling, Aoki.'], o2: [['Say Ogawa is attached to his plants', 'neutral|I know. He has named them all. One is called Kenji.', 15], ['Say the roof is big', 'neutral|It is. Hm. It has two sides. Perhaps.', 15], ['Say you will think of something', 'happy|Please do. Soon. Before the next meteor shower.', 20]],
    m: ['@Ogawa and Fujita stand on the greenhouse roof, each pointing at a different patch of sky.'], mo: [['Divide the roof: sun side and star side', 'happy|Half tomatoes, half telescope! Brilliant!', 'happy|A fair split. Tomatoes by day, stars by night.', 'both'], ['Back Ogawa: tomatoes need the sun', 'happy|THANK YOU!', 'sad|Fine. The telescope goes to the roof of the gym.', 'a'], ['Back Fujita: stars need clear sky', 'sad|The tomatoes will cope. Probably.', 'happy|Excellent. Thank you, Aoki.', 'b']],
    end: ['@A neat line of paint splits the roof in two: a sun symbol on one side, a star on the other. Kenji approves.'], reward: { item: 'crop_giant_tomato', coins: 120 } }),
  DR({ id: 'parcel', a: 'pip', b: 'kiko', title: 'The Wrong Parcel', mail: 'Misa!! Help!! I delivered a very important parcel to the wrong house. Meet me by the torii!',
    s1: ['sad|Kiko\'s retro cartridge parcel. I delivered it to the other blue house. The other BLUE house.', 'It is the only copy in the country. She has been waiting two weeks. I am so dead.'], o1: [['Tell Pip to confess', 'sad|Yes. Yes. Right. Confession. With a bow.', 20], ['Offer to go with her to the house', 'happy|You would? You are my hero. Possibly my lifeline.', 15], ['Say it will turn up', 'surprised|It WILL turn up! Probably! Eventually!', 5]],
    s2: ['neutral|Pip told me about the parcel. I was calm. I am a keeper. A keeper is always calm. ...I screamed into a pillow.', 'It is the final cartridge in the Neko Jump series. I need it.'], o2: [['Say Pip is trying hard', 'neutral|She is. She is always trying. That is the problem and the charm.', 15], ['Say you will help search', 'happy|Thank you. Search with me. A keeper never searches alone.', 20], ['Say it is just a game', 'sad|Do not say that. Do not ever say that.', 0]],
    m: ['@Pip and Kiko stand outside a blue house. The other blue house. A tiny cartridge peeks out of the mailbox.'], mo: [['Fetch it and have Pip apologise', 'happy|Delivered, signed, sealed! I am so sorry, Kiko!', 'happy|It is okay. It is safe. I forgive you. Also, play with me.', 'both'], ['Let Pip off the hook', 'happy|Phew!', 'sad|I shall be keeping an eye on the post.', 'a'], ['Have Kiko lecture her gently', 'sad|I deserve it.', 'neutral|The kami are patient. I am less so.', 'b']],
    end: ['@Pip and Kiko plug in the cartridge together on the shrine porch. It takes eleven attempts to beat level one.'], reward: { item: 'gift_retro_cartridge', coins: 100 } }),
  DR({ id: 'cards', a: 'hana', b: 'goro', title: 'Cards at Sunny Pines', mail: 'Misa, dear. A small matter. Please come to the pines. Bring a clear head and biscuits. - Hana',
    s1: ['happy|Mr. Hayashi accused me of cheating at cards! Me! I am an honest cheat. I mean, an honest woman.', 'neutral|I may have a card up my sleeve. Only one. For luck.'], o1: [['Say luck is allowed', 'happy|Exactly, dear. Luck is part of the game.', 10], ['Say honesty is best', 'neutral|Hm. Perhaps. I will think about it. Slowly.', 15], ['Laugh and take a card', 'happy|Ha! Take it! The ace of hearts. It brings you luck too.', 20]],
    s2: ['neutral|Hmph. Hana wins every round. Every. Round. Thirty-one years. I counted the cards. There are too many aces.', 'But she laughs when she wins. That sound. I would lose a thousand games for it.'], o2: [['Say Hana loves the game', 'neutral|She does. She says it keeps her sharp. It keeps me poor.', 10], ['Say you will watch the next game', 'neutral|A witness. Hm. Sensible. Do.', 20], ['Say let her win', 'neutral|Never. I have my pride. It is mostly rubbish.', 5]],
    m: ['@Hana and Goro sit across a low table at Sunny Pines. A pile of cards lies between them like a fallen deck of cards.'], mo: [['Deal a fresh deck and watch fairly', 'happy|A new deck! And I will win it fair!', 'neutral|Fine. Fair. Prepare to lose, Hana.', 'both'], ['Take Hana\'s side', 'happy|Thank you, dear!', 'sad|Hmph. Of course.', 'a'], ['Take Goro\'s side', 'sad|Oh. Really?', 'happy|Finally! Justice!', 'b']],
    end: ['@Hana draws the last card, smiles and puts the ace of hearts back in the pile. Goro does not notice.'], reward: { item: 'gift_pressed_flower', coins: 120 } }),
  DR({ id: 'ball', a: 'kai', b: 'theo', title: 'The Ball and the Mural', mail: 'Misa, bro, I did a bad thing. Come to the harbour. Please. Bring snacks. Theo is not happy.',
    s1: ['sad|My ball hit Theo\'s mural. Right in the middle of the blue. There is a footprint-shaped smudge.', 'He said "it is fine". His face said "it is not fine".'], o1: [['Tell him to say sorry properly', 'happy|You are right. A real sorry. With a snack.', 20], ['Offer to fix the smudge', 'happy|Can you? Theo can fix it. If he lets me.', 10], ['Say it is a free texture', 'surprised|Is it? Is that a real art word? ...I will try it.', 5]],
    s2: ['neutral|Kai kicked a ball into my mural. I said it is fine. It is not fine. It is a big smudge, right in the sky.', 'sad|But he came every day for a week to apologise. Loud. Sorry. A man made of sorry.'], o2: [['Say Kai is sorry', 'neutral|He is. He brought three types of snacks. All the same.', 15], ['Say the smudge looks like a cloud', 'neutral|...It does, actually. A weird cloud.', 20], ['Say paint over it', 'neutral|Painting over is the nuclear option. I will think.', 10]],
    m: ['@Kai and Theo stand in front of the mural. A single smudged patch glows in the sky. Kai clutches a bag of snacks.'], mo: [['Turn the smudge into a cloud together', 'happy|A cloud! The BEST cloud! Theo, you are a genius!', 'happy|...Fine. A cloud with a footprint. It has character.', 'both'], ['Back Kai: it was an accident', 'happy|Thanks, Misa!', 'sad|It still stings.', 'a'], ['Back Theo: Kai should repaint', 'sad|Yeah. I will repaint it. With help.', 'happy|Thank you.', 'b']],
    end: ['@Theo adds a tiny signature in the cloud\'s corner. It says "K and T". Kai sniffles into a rice ball.'], reward: { item: 'snack_onigiri_salmon', coins: 100 } }),
  DR({ id: 'quiet', a: 'rina', b: 'hina', title: 'The Quiet Hour', mail: 'Aoki. A discreet matter. Library. Fourth table. Bring a pen. - R.H.',
    s1: ['neutral|Hina brought a cricket jar to the library. It chirped during my mock exam. Twice. In harmony.', 'sad|I scored 98. Not 100. And she thinks it is funny.'], o1: [['Say crickets are a bad omen', 'neutral|Do not be silly. Crickets are fine. It was the harmony.', 5], ['Say Hina meant no harm', 'neutral|She never does. That is the trouble.', 15], ['Offer to talk to her', 'neutral|Do. Quietly. With words.', 20]],
    s2: ['surprised|Rina is mad at me? About the cricket? He was singing for her! He is a good cricket!', 'sad|Everyone says I am too loud. I do not mean to be. I just love the little noises.'], o2: [['Say Rina needs quiet', 'sad|I know. I should have asked. Quiet is hard when you are me.', 15], ['Say crickets are lovely', 'happy|They are! But maybe not in the library.', 10], ['Suggest a quiet hour for crickets', 'happy|A quiet hour! Hm. Maybe I can train him. Maybe.', 20]],
    m: ['@Rina and Hina sit at opposite ends of the library table. A small jar sits in the middle, silent, for now.'], mo: [['Set a quiet hour and a cricket hour', 'neutral|A schedule. Acceptable. Two hours of chirping, two hours of silence.', 'happy|Cricket hour! He will love it!', 'both'], ['Back Rina: no crickets', 'neutral|Thank you.', 'sad|Oh. Okay. He will wait outside.', 'a'], ['Back Hina: crickets are friends', 'sad|Hm. Fine.', 'happy|YES!', 'b']],
    end: ['@The cricket chirps once, politely, on the stroke of four. Rina does not look up. She is smiling.'], reward: { item: 'bug_bell_cricket', coins: 100 } }),
];
const dramaOf = (id) => DRAMAS.find((d) => d.id === id);
const active = (g) => S(g).drama.active;
export function startDrama(g, id) {
  const d = dramaOf(id);
  S(g).drama.active = { id, stage: 1, due: g.day };
  g.mail(`sv3_drama_${id}`, nameOf(d.a), d.mail);
  g.stat('dramasStarted');
}
export function nextDrama(g) {
  const s = S(g).drama;
  return DRAMAS.find((d) => !s.done[d.id] && g.hearts(d.a) >= 3 && g.hearts(d.b) >= 3);
}
const side = (d, who, steps) => sc(who, ...steps);
function stepsFor(g, d, stage) {
  const eid = 'sv3d_' + d.id;
  const adv = (st, due) => ({ t: 'call', fn: (g2) => { const a = S(g2).drama.active; if (a && a.id === d.id) { a.stage = st; a.due = g2.day + due; } } });
  if (stage === 1) return sc(d.a, ...d.s1, ch3(eid, 'What do you say?', ...d.o1.map(([t, r, p]) => [t, r, p, flag(`soc3_drama_${d.id}_a${d.o1.findIndex((x) => x[0] === t)}`)])), adv(2, 1), { t: 'call', fn: (g2) => g2.toast(`Next, hear ${nameOf(d.b)}'s side.`, 'heart') });
  if (stage === 2) return sc(d.b, ...d.s2, ch3(eid, 'What do you say?', ...d.o2.map(([t, r, p]) => [t, r, p, flag(`soc3_drama_${d.id}_b${d.o2.findIndex((x) => x[0] === t)}`)])), adv(3, 1), { t: 'call', fn: (g2) => g2.toast(`Time to bring ${nameOf(d.a)} and ${nameOf(d.b)} together.`, 'heart') });
  const outcomes = { both: 55, a: 40, b: 40 };
  return sc(d.a, ...d.m,
    ch3(eid, 'How do you mediate?', ...d.mo.map(([t, al, bl, res]) => [t, al, `${d.b}/${/^[a-z]+\|/.test(bl) ? bl.split('|')[0] : 'neutral'}|${bl.replace(/^[a-z]+\|/, '')}`, flag(`soc3_drama_${d.id}_${res}`),
      { t: 'call', fn: (g2) => {
        const bigger = outcomes[res], winner = res === 'a' ? d.a : res === 'b' ? d.b : null;
        g2.addFriend(d.a, res === 'b' ? 15 : bigger); g2.addFriend(d.b, res === 'a' ? 15 : bigger);
        if (winner) g2.addFriend(winner, 10);
        S(g2).drama.done[d.id] = res; S(g2).seen[eid] = g2.day;
        giveOr(g2, d.reward.item, d.reward.coins); g2.addMoney(res === 'both' ? d.reward.coins : Math.round(d.reward.coins / 2), true);
        if (res === 'both') stickers(g2, 2, d.title);
        g2.stat('dramasSolved'); S(g2).drama.active = null; S(g2).drama.next = g2.day + 4;
      } }]),
    ), ...d.end.map((l) => l), mood(12), time(30));
}
for (const d of DRAMAS) {
  for (const [stage, who] of [[1, d.a], [2, d.b], [3, d.a]]) {
    register('talkHook', `sv3_drama_${d.id}_${stage}`, { npc: who, priority: 45,
      when: (g) => { const a = active(g); return !!a && a.id === d.id && a.stage === stage && g.day >= a.due; },
      steps: (g) => stepsFor(g, d, stage) });
  }
  register('script', 'sv3_drama_' + d.id, { steps: (g) => [...stepsFor(g, d, 1), ...stepsFor(g, d, 2), ...stepsFor(g, d, 3)] });
}
register('system', 'sv3Dramas', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = S(game).drama;
      if (s.active || game.day < Math.max(6, s.next || 0)) return;
      const d = nextDrama(game);
      if (d && game.rngFor('sv3drama')() < 0.5) startDrama(game, d.id);
    });
    game.sv3 = Object.assign(game.sv3 || {}, { startDrama: (id) => startDrama(game, id), dramas: DRAMAS });
  },
});

// ---------- letters from the future ----------
export const LETTERS = {
  kai: 'Dear Misa, it is ten years from now and I just scored the winning goal in front of the whole stadium. Do you know what I did? I looked for you in the stands. You were there. You are always there. Let\'s gooo, forever. - Kai',
  suzu: 'Dear Misa, my first novel is on the shelf of the Hoshimori library. Page one says: for Misa, who asks what happens next. I wrote the dedication and cried for an hour. Thank you for my ending, and for all my beginnings. - Suzu',
  rina: 'Dear Misa, I have a corner office. It is very tidy. On the desk is a framed photo of two girls at a school contest, one scowling, one grinning. You were right. Friendship is not a distraction. - Rina',
  theo: 'Dear Misa, there is a gallery in Busan. One wall is the harbour at dusk. People ask who painted the tiny girl with the cat. I say: the town did. And a friend. - Theo',
  hina: 'Dear Misa, I found a new species of beetle! It was in the park, under the sakura tree. I named it after you. It is tiny, it is clever, it is a bit shy, and it glows in the dark. - Hina',
  fujita: 'Dear Misa, the Astronomy Club now has a real observatory on the school roof. The plaque reads: for every kid who ever looked up. I think Hana would have smiled. I did. Keep looking up. - Akane',
  ogawa: 'Dear Aoki! The greenhouse now feeds half the town. And there is a statue of a tomato with your face on it. Not really! But I thought about it! Breathe deep, grow strong. - Ogawa',
  hana: 'Dear Misa, I may have forgotten a thing or two, but I have kept the good ones. The lantern still burns. The song still sings. You are still my Misa. I wrote this down so I would not lose it. - Grandma',
  tobias: 'Dear Misa, the shop has a new sign. It reads: Wren and Aoki, Clocks. I know it has not happened yet. I wanted to write it down. A man may hope in a precise hand. - Tobias',
  mika: 'Dear Misa, Cafe Kumo has three floors now! There is a tiny star on the menu for you. Kumo-chan retired, but she made a speech. Mostly steam. It was moving. - Mika',
  sachiko: 'Dear Misa, I am ninety and still running the gossip. The mart is now a legend. I have told the whole street about your success. Twice. Thank you for being my sunshine, dear. - Sachiko',
  jun: 'Dear first mate, the Sayori is fitted with a new engine. She still creaks. The bell still rings. When it does, I think of you, and the whole sea smiles. Fair winds. - Captain Jun',
  kiko: 'Dear Misa, the shrine has a Neko Jump corner now. It is the only one in the country. The kami are said to approve. The bell still rings at midnight. Come and ring it. - Kiko',
  pip: 'Dear Misa, I just delivered my millionth letter! It was addressed to you. It said: thank you for always smiling at the door. I put a sticker on it. First class forever. - Pip',
  goro: 'Dear Misa, the rose is still blooming. Daifuku has grey whiskers. Your garden is better than mine and I have told everyone. Do not make me say it twice. - Goro',
};
register('system', 'sv3Letters', {
  init(game) {
    game.bus.on('heartEvent', ({ npc, id }) => { if (id === `sv3_${npc}_h10`) S(game).letterQ.push({ day: game.day + 6, id: npc }); });
    game.bus.on('dayStart', () => {
      const s = S(game), now = s.letterQ.filter((l) => l.day <= game.day);
      s.letterQ = s.letterQ.filter((l) => l.day > game.day);
      for (const l of now) {
        if (s.letters[l.id]) continue;
        s.letters[l.id] = game.day;
        game.mail(`sv3_letter_${l.id}`, nameOf(l.id), LETTERS[l.id]);
        game.addMoney(150, true); stickers(game, 1, nameOf(l.id)); game.toast(`A letter from the future from ${nameOf(l.id)}!`, 'i_mail'); game.stat('futureLetters');
      }
    });
  },
});

// ---------- Friend Circle ----------
const CIRCLE_LINE = {
  kai: 'Best friends squad! Let\'s gooo!', suzu: 'I think we are a chapter. A very long, good one.', rina: 'I accept the circle. Provisionally. Fine, enthusiastically.', theo: 'This is a nice drawing. We are in it.',
  hina: 'A circle of friends! Like a ring of mushrooms! The lucky kind!', fujita: 'A constellation of people. Textbook.', ogawa: 'A team! The best team! Hup hup!', hana: 'Oh, my dears. All together. How wonderful.',
  tobias: 'Hm. Five hands on one clock. It keeps better time.', mika: 'Kumo-chan, we are a circle! She says "hsssss". She is delighted.', sachiko: 'I shall tell the whole street. In alphabetical order.', jun: 'A fine crew. Fair winds to all of you.',
  kiko: 'Multiplayer mode. Unlocked.', pip: 'I will deliver to all of you, forever, first class!', goro: 'Hmph. ...A decent bunch. Do not tell them I said that.',
};
export function circleSteps(g) {
  const who = bestFriends(g).sort((a, b) => g.friendPts(b) - g.friendPts(a)).slice(0, 5);
  const names = ['The Lantern Circle', 'The Little Life Club', 'Misa\'s Crew'];
  return [{ t: 'call', fn: (g2) => { S(g2).circle = g2.day; } },
    ...sc('misa', '@Evening in Sakura Park. Under the big tree, five familiar figures wait on a picnic blanket, trying to look casual and failing.',
      `${who[0]}/happy|There you are. We were just... having a picnic. A completely ordinary one.`,
      `${who[1]}/happy|It is not an ordinary picnic. We have been planning this for a week.`,
      '>surprised|What is going on?',
      `${who[2]}/happy|You are our best friend, Misa. All five of us. We counted.`,
      `${who[3]}/happy|So we decided: it is time to make it official.`,
      `${who[4]}/happy|A circle. With you in the middle. And one extra chair for Mochi.`,
      ...who.map((id) => `${id}/happy|${CIRCLE_LINE[id]}`),
      '*>heart', '>happy|I... don\'t know what to say. Except thank you. All of you.',
      ch3('sv3_circle', 'What shall the circle be called?',
        ...names.map((n) => [n, { t: 'call', fn: (g2) => { const t = `Friend Circle: ${n}`; (g2.state.titles ||= []).includes(t) || g2.state.titles.push(t); g2.state.title = t; S(g2).circleName = n; } }, `@Five friends clap. Mochi sneezes. The name is carved, tiny, into the bark of the sakura tree.`])),
      '@The sun goes down. Nobody leaves. The picnic lasts until the stars come out.',
      mood(30), time(90)),
    ...who.map((id) => ({ t: 'friend', npc: id, n: 40 })),
    { t: 'call', fn: (g2) => { giveOr(g2, 'furn_photo_frame', 300); stickers(g2, 5, 'Friend Circle'); g2.setFlag('soc3_friend_circle'); g2.stat('friendCircles'); g2.bus.emit('sv3Circle', {}); } }];
}
register('script', 'sv3_friend_circle', { steps: (g) => circleSteps(g) });
register('system', 'sv3Circle', {
  init(game) {
    const tryRun = () => {
      if (S(game).circle || bestFriends(game).length < 5) return;
      if (!(game.world && game.world.map && game.world.map.id === 'park' && game.scenes.top === game.world && !game.world.busy)) return;
      if (game.minutes < 16 * 60 || game.minutes > 21 * 60) return;
      game.run(circleSteps(game));
    };
    game.bus.on('mapEnter', () => setTimeout(tryRun, 1500));
    game.bus.on('hour', tryRun);
    game.sv3 = Object.assign(game.sv3 || {}, { runCircle: () => game.run(circleSteps(game)) });
  },
});

features('Relationships Deep', [
  '40 new overheard NPC-to-NPC conversations in 20 ordered pairs (Kai and Rina, Suzu and Theo, Hina and Goro, Mika and Sachiko, Hana and Goro, Tobias and Goro, Jun and Kai and more)',
  'Each pair\'s second chat only plays after the first, and hearing both marks that friendship in the Bonds web',
  'Town dramas: ten multi-day mini-stories (The Bun War, Borrowed Notes, Whose Story Is It, The Missing Seedlings and six more)',
  'Each town drama: hear one side, hear the other, then mediate with a compromise, or back one friend, for coins, gifts, Star Stickers and hearts',
  'Letters from the future: after each Best Friend capstone, that friend mails a long letter from ten years ahead with coins and a Star Sticker',
  'Friend Circle: with five Best Friends the circle gathers under the sakura tree, you name it, earn a title, a photo frame and Star Stickers',
]);
