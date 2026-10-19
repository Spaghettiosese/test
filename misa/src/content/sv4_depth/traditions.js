// Personal traditions: one recurring yearly ritual per person (talk to them on their day), a unique visual on that day, and a photo wall entry.
import { register, get } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { yearOf, dateText } from '../../core/time.js';
import { sc, ch, flag, giveOr } from '../social/util.js';
import { S, remember, nameOf, talkBook } from './state.js';
import { TRAD_DATE } from './tradedates.js';
import { baseAvailable } from './moods.js';
import { T } from './kit.js';

// vis: [motion, colors]; motion rise | fall | orbit | twinkle | drift
export const TRADS = [
  { id: 'mika', name: 'The First Batch', map: 'cafe', spot: 'counter', vis: ['rise', ['#fff6e6', '#ffd0d8']], item: 'dish_kumo_omurice', coins: 120,
    steps: [`@Cafe Kumo smells of vanilla before sunrise. Mika stands over a single tray of golden cookies, apron dusted, a tiny flag stuck in the first one.`, `happy|Every year, the first batch of the season goes to one taster. Mum did it with the whole street. I do it with you.`, ch(`Taste the first cookie:`, [`Close your eyes and chew slowly.`, T('calm'), `happy|Mum used to say the first bite tells you the whole year. What does it say?`, `>happy|Warm. Hopeful. A bit of smoke.`, `happy|A bit of smoke! Perfect. That's the Kumo year!`], [`Break it in half and share it.`, T('kind'), `happy|Sharing the first one! She did that too. Ooh, I'm going to cry into the dough.`]), `@She pins the flag on the wall board. A new line is added to a long list of first tasters.`] },
  { id: 'goro', name: 'Seedling Swap', map: 'lane', spot: 'goro_garden', vis: ['drift', ['#8ad06a', '#c8f09a']], item: 'mat_fertiliser', coins: 100,
    steps: [`@Trays of seedlings crowd Goro's garden wall. Each has a paper tag in a gnarled hand.`, `neutral|Seedling swap. Every spring I give one to the neighbourhood. In return, they give me one. That is the custom. Don't spoil it with thanks.`, ch(`Choose a seedling:`, [`The tomato. For Mr. Ogawa's rivalry.`, T('brave'), `neutral|Hmph. Ogawa's beaten for tomatoes by a girl with a trowel. I approve.`], [`The sunflower. It needs room.`, T('curious'), `neutral|Room. Light. Patience. Good. You listen to plants. That's rare.`]), `@He wraps the seedling in newspaper and makes you promise to water it. In the morning. Not the evening.`] },
  { id: 'jun', name: 'Launch Day', map: 'harbour', spot: 'boat', vis: ['drift', ['#6ab0f0', '#fff6e6']], item: 'gift_lucky_lure', coins: 120,
    steps: [`@Bunting zigzags across the harbour. The Sayori gleams with fresh paint.`, `happy|Launch day, kid! First time on the water this season. Every year we break a bottle of tea on the bow. Tea, because the harbour inspector's watching.`, ch(`Break the tea bottle:`, [`Swing it hard.`, T('brave'), `happy|SPLASH! There she goes! Good luck for a thousand fish!`], [`Pour it gently on the bow.`, T('kind'), `happy|A kinder launch. The Sayori purrs. She likes it.`]), `@The old boat bobs, proud as a pup, and the whole pier cheers.`] },
  { id: 'pip', name: 'First Stamp of Summer', map: 'post_office', spot: 'counter', vis: ['fall', ['#fff6e6', '#e0707a']], item: 'gift_postcard', coins: 100,
    steps: [`@Envelopes drift in the post office draught. A tiny table holds a single sheet of brand-new stamps.`, `happy|Misa! First stamp of summer! Tradition says the first sheet's first stamp goes on a letter to someone you miss!`, ch(`Who should the letter go to?`, [`Mum and Dad on the Kujira.`, T('kind'), `happy|Aww! I'll hand-stamp it myself! It'll cross the sea with a flourish!`], [`Grandma Hana.`, T('kind'), `happy|On the bike! Straight to Sunny Pines! Zoom!`], [`Yourself.`, T('curious'), `happy|A letter to future Misa! Best address in town!`]), `@Pip presses the stamp with a ceremonial thump. A smudge of ink lands on his nose.`] },
  { id: 'kai', name: 'Season Kick-off', map: 'school_grounds', spot: 'goal', vis: ['fall', ['#ff6a6a', '#ffd76a', '#6ad0ff']], item: 'gift_soccer_card', coins: 120,
    steps: [`@Confetti flutters across the field. A single soccer ball sits on the centre spot, wearing a ribbon.`, `happy|The Season Kick-off! The first kick of the summer goes to somebody special. Tradition! I invented it this morning!`, ch(`Take the first kick:`, [`Go for a long shot.`, T('brave'), `happy|Whoa! It cleared the goal, the fence AND Mr. Ogawa's hat! Perfect!`], [`A neat little pass to Kai.`, T('kind'), `happy|A pass! A TEAM move! That's the spirit!`]), `@Cheers ripple over the field. Sota rolls a second ball in the wrong direction.`] },
  { id: 'ogawa', name: 'First Tomato', map: 'school_grounds', spot: 'greenhouse', vis: ['twinkle', ['#e04a3a', '#ffd76a']], item: 'crop_tomato', coins: 100,
    steps: [`@The greenhouse door is propped open. A lone red tomato glows on the first vine.`, `happy|AOKI! The First Tomato! Every year I pick it myself and share it with one person. This year, YOU!`, ch(`Eat it:`, [`Salt and all, right there.`, T('brave'), `happy|The correct way! Juice, sun, and salt! Wonderful!`], [`Cut it into four and share.`, T('kind'), `happy|Four slices! One for you, one for me, one for Goro over the fence, one for the vine!`]), `@He wipes his hands on his tracksuit and beams like a sunrise.`] },
  { id: 'hina', name: 'Firefly Night', map: 'park', spot: 'pond_edge', vis: ['twinkle', ['#d0ff6a', '#fff6a0']], item: 'bug_firefly', coins: 120,
    steps: [`@Dusk. The pond edge is dark and still. Then, one by one, tiny green lights begin to blink.`, `happy|Shh! Firefly night! Once a year, they all show up at once! Gerald the Fourth does NOT approve of competition!`, ch(`How do you watch?`, [`Lie flat on the bank and stay still.`, T('calm'), `happy|Perfect! You're a log! The best logs get the best view!`], [`Count them quietly with her.`, T('curious'), `happy|Forty-one! Forty-two! Oh, there's one in your hair!`]), `@You watch the lights drift over the water like a slow, living constellation.`] },
  { id: 'tobias', name: 'Clock-Winding Day', map: 'clock_shop', spot: 'counter', vis: ['orbit', ['#e8c870', '#a88a40']], item: 'mat_spring', coins: 140,
    steps: [`@Every clock in the shop has been opened. Keys lie in a neat row on a velvet cloth.`, `neutral|Clock-winding day. Once a year, every clock in this shop is wound by hand. All of them. It takes the whole day. Hold this.`, ch(`Which clock do you wind?`, [`The big grandfather clock.`, T('brave'), `neutral|Thirty turns. Slowly. Don't force the last one. It's older than both of us put together.`], [`The little silent one on the shelf, Grace.`, T('kind'), `neutral|...Yes. Grace. Gently. She always liked your hands.`]), `@When the last key turns, a thousand ticks fall into a single, perfect rhythm.`] },
  { id: 'suzu', name: 'The Book Swap', map: 'library', spot: 'table_1', vis: ['fall', ['#fff6e6', '#c8b8f0']], item: 'book_poetry', coins: 100,
    steps: [`@The reading table is stacked with tiny paper parcels. Each is tied with string and labelled "to a stranger".`, `happy|Autumn Book Swap. Everyone wraps a book they love and exchanges it blind. I've wrapped three. Which one do you take?`, ch(`Choose a parcel:`, [`The thin one.`, T('curious'), `happy|Oh! The thin one is poems. Mine. ...I'm not telling you which.`], [`The thick one.`, T('calm'), `happy|A long, strange mystery. It has a map in the front. I love this.`]), `@A card slips out: "This book was loved. Pass it on." Suzu blushes, pleased.`] },
  { id: 'hana', name: 'Lantern Song Night', map: 'sunny_pines', spot: 'garden_bench', vis: ['drift', ['#ffb870', '#ffe0a0']], item: 'gift_pressed_flower', coins: 120,
    steps: [`@Paper lanterns glow in the Sunny Pines garden. Grandma Hana sits on the bench with her shawl and a song-book.`, `happy|Lantern Song Night, my darling. We sing the old song. I may forget the second verse. You must remember it for me.`, ch(`Sing:`, [`Start the first verse softly.`, T('calm'), `happy|There you are! The words come when you hum first!`], [`Sing loudly, so the sparrows join.`, T('brave'), `happy|The sparrows ARE joining! Listen! A choir!`]), `@The lanterns bob. Somewhere in the song, she squeezes your hand and does not forget it.`] },
  { id: 'fujita', name: 'Meteor Night', map: 'school_roof', spot: 'telescope', vis: ['fall', ['#d0e8ff', '#fff6e6']], item: 'gift_star_chart', coins: 140,
    steps: [`@The roof is dark. Blankets in rows. Ms. Fujita holds a red torch and a thermos.`, `neutral|Meteor night. Count with me. Every shooting star gets a tally, and a wish, and a silence for the wish.`, ch(`Count aloud or silently?`, [`Aloud, for the record.`, T('curious'), `happy|Seven! Eight! Nine! Aoki, you're the best assistant I've had since the dome.`], [`Silently, for the wish.`, T('calm'), `neutral|Quiet counters make the best wishes. Mine is also very quiet.`]), `@A streak of silver crosses the sky, and nobody says anything for a very long time.`] },
  { id: 'theo', name: 'First Snow Sketch', map: 'school_roof', spot: 'bench', vis: ['fall', ['#ffffff', '#cfe8ff']], item: 'gift_star_sketch', coins: 120,
    steps: [`@The roof is pale with the first snow. Theo sits at the railing with a sketchbook and a pencil frozen to his glove.`, `neutral|First snow. I draw it every year. Same bench. Same angle. Same hands getting colder.`, ch(`Join:`, [`Sketch the snow beside him.`, T('curious'), `neutral|Your snow looks like cotton. Mine looks like static. Both are right.`], [`Hold the thermos while he draws.`, T('kind'), `neutral|...Thanks. Warm hands make better lines.`]), `@He tears out a page and hands it over. A small figure and a smaller cat, in snow.`] },
  { id: 'sachiko', name: 'Anniversary Sale', map: 'mart', spot: 'register', vis: ['rise', ['#ff8aa0', '#ffd76a', '#6ad0ff']], item: 'gift_jam', coins: 160,
    steps: [`@Balloons crowd the Sunny Mart ceiling. A banner reads: 40 YEARS OF SUNNY! Streamers hang over the tins.`, `happy|Anniversary Sale, dear! Forty years! Every customer gets a rice cracker and a sticker. You get a rice cracker, a sticker and a hug!`, ch(`Help with the sale:`, [`Man the rice cracker basket.`, T('kind'), `happy|You're hired! Unpaid! But with crackers!`], [`Draw the sale poster.`, T('curious'), `happy|Look at that! A tiny me with a tin of peaches. I'm putting it in the window!`]), `@The first customer of the day is Kai. He buys nothing and eats three samples.`] },
  { id: 'rina', name: 'The Winter Recital', map: 'school_halls', spot: 'music_room', vis: ['rise', ['#c8b8f0', '#fff6e6']], item: 'gift_gold_stationery', coins: 140,
    steps: [`@The music room is lit by a single lamp. Rina stands with her violin, back straight, bow trembling just a little.`, `neutral|The winter recital. One piece, one listener. I've done it every year since I was ten. This year the listener is you.`, ch(`Listen:`, [`Close your eyes.`, T('calm'), `neutral|...Good. Don't open them until I say. Or until it's over.`], [`Watch her hands.`, T('curious'), `neutral|Don't. They're shaking. Please look at the window.`]), `@The melody is slow and a little crooked, and entirely hers. She bows. You clap until your palms sting.`] },
  { id: 'kiko', name: 'Year-End Bell', map: 'shrine', spot: 'offering_box', vis: ['orbit', ['#ffd76a', '#fff6e6']], item: 'gift_wind_chime', coins: 160,
    steps: [`@Torchlight on the shrine steps. The great bell hangs silent, its rope worn smooth.`, `neutral|The Year-End Bell. One ring for each worry you wish to let go of. I keep a tally. The wind keeps the rest.`, ch(`How many rings?`, [`One. For the biggest worry.`, T('calm'), `@BONG. The note rolls over the hill. Kiko closes her eyes and breathes out with you.`], [`Three. Let them all go.`, T('brave'), `@BONG. BONG. BONG. Crows burst from the cedars. Kiko laughs for the first time in a week.`]), `neutral|The year can end now. Thank you for ringing it with me.`] },
  { id: 'aoi', name: 'Postcard Run', map: 'park', spot: 'bridge', vis: ['drift', ['#3aa0c8', '#fff6e6']], item: 'gift_postcard', coins: 100, guard: true,
    steps: [`@Dawn on the park bridge. Aoi stands with a stack of postcards in her track jacket and a pen behind her ear.`, `neutral|Every year on the day I arrived, I run one postcard to the sea and read it aloud. It's silly. It helps.`, ch(`What should the postcard say?`, [`"I'm fine, and I mean it."`, T('brave'), `happy|Fine, and I mean it. That's different from my usual. I like it.`], [`"I found somebody to run with."`, T('kind'), `happy|...Somebody. Okay. Yes. That one.`]), `@She runs to the waterline and holds the card up to the wind.`] },
  { id: 'haru', name: 'Anniversary Edition', map: 'town', spot: 'noticeboard', vis: ['fall', ['#fff6e6', '#a8586a']], item: 'book_picture_book', coins: 120, guard: true,
    steps: [`@A fresh stack of newspapers sits on the noticeboard bench, ink still smelling sharp.`, `happy|The Anniversary Edition! Eight pages and a quiz. One headline is yours to choose.`, ch(`Pick the headline:`, [`"Town Cat Wins Respect"`, T('curious'), `happy|Mochi will be insufferable. Print it!`], [`"Local Girl Is Kind, Reports Local Paper"`, T('kind'), `happy|Stop it, I'll cry on the ink. Printing!`]), `@Haru slides the first copy into your hands, warm from the press.`] },
  { id: 'sora', name: 'The Golden Hour Portrait', map: 'lighthouse', spot: 'balcony', vis: ['twinkle', ['#ffd76a', '#ffb870']], item: 'gift_star_sketch', coins: 120, guard: true,
    steps: [`@The lighthouse balcony glows amber. Sora sets her camera on a worn tripod and checks the light with her palm.`, `happy|Golden hour. Once a year, I take one portrait of someone from the town. Natural light. No smile required.`, ch(`Pose:`, [`Look out at the sea.`, T('calm'), `happy|There. Quiet and honest. Hold... hold... click.`], [`Look straight at the lens.`, T('brave'), `happy|That's it. That's the one. Click. I'll print it for the wall.`]), `@She lowers the camera and, for once, doesn't say anything clever.`] },
  { id: 'momo', name: 'The Winter Loaf', map: 'town', spot: 'market_2', vis: ['rise', ['#fff6e6', '#ffd0a0']], item: 'dish_apple_pie', coins: 140, guard: true,
    steps: [`@A long table at the market holds a single golden loaf the size of a pillow, still steaming.`, `happy|The Winter Loaf, dear heart! One giant loaf, shared with the whole street. Slicing's an honour. Care to slice?`, ch(`Slice:`, [`Slow and even.`, T('calm'), `happy|Perfect slices! You'd make a baker!`], [`A big dramatic first cut.`, T('brave'), `happy|Ooh, the crust sings! That's a good loaf!`]), `@Neighbours gather with napkins. Steam rises into the cold air like a blessing.`] },
];
const BYID = Object.fromEntries(TRADS.map((t) => [t.id, t]));
export const tradOf = (id) => BYID[id];

function tagPick(steps) {
  return steps.map((s) => s.t === 'choice' ? { ...s, options: s.options.map((o) => ({ ...o, steps: [{ t: 'call', fn: (g) => { S(g).tmp = o.text; } }, ...(o.steps || [])] })) } : s);
}
export const tradActive = (g, id) => {
  const t = BYID[id], s = S(g);
  return !!t && !!get('npc', id) && TRAD_DATE[id] && check('date:' + TRAD_DATE[id], g) && g.hearts(id) >= 3 && s.trad[id] !== yearOf(g.day) && !!g.state.seen['met:' + id] && baseAvailable(g, id);
};
export const photoCount = (g) => S(g).photos.length;

for (const t of TRADS) {
  if (!get('npc', t.id)) continue;
  register('talkHook', 'sv4d_trad_' + t.id, {
    npc: t.id, priority: 8, when: (g) => tradActive(g, t.id),
    steps: (g) => tagPick(sc(t.id,
      { t: 'call', fn: (gg) => { talkBook(gg, t.id); S(gg).tmp = ''; } },
      `@${t.name}. ${dateText(g.day)}.`, ...t.steps,
      { t: 'call', fn: (gg) => {
        const s = S(gg), y = yearOf(gg.day);
        s.trad[t.id] = y; s.photos.push({ id: t.id, year: y, day: gg.day, pick: s.tmp || '' });
        gg.setFlag(`sv4d_trad_${t.id}_y${y}`, true);
        remember(gg, t.id, 'tradition', { name: t.name, year: y });
        gg.stat('sv4dTraditions'); gg.toast(`Photo wall: ${t.name}`, 'star');
        gg.addFriend(t.id, 40);
        if (!get('item', t.item)) gg.addMoney(t.coins); else gg.give(t.item, 1);
      } },
      '*heart', `@A new photo goes up on the Town Almanac photo wall.`)),
  });
  const d = get('npc', t.id);
  if (d) { d.schedule = d.schedule || []; d.schedule.unshift({ when: `date:${TRAD_DATE[t.id]}`, stops: [{ at: '09:00', map: t.map, spot: t.spot }, { at: '18:30', map: null }] }); }
}

// ---------- visuals: unique effect over the tradition spot on its day ----------
register('worldLayer', 'sv4d_trad_vis', {
  overlay(g, world, game) {
    try {
      const mid = world.map.id, now = Date.now() / 1000, y = yearOf(game.day);
      for (const t of TRADS) {
        if (t.map !== mid || !get('npc', t.id) || !check('date:' + TRAD_DATE[t.id], game)) continue;
        const sp = (world.map.def || get('map', mid) || {}).spots; const p = sp && sp[t.spot]; if (!p) continue;
        const cx = world.sx(p[0] * 16 + 8), cy = world.sy(p[1] * 16 + 8), done = (S(game).trad[t.id] === y), [mo, cols] = t.vis;
        for (let i = 0; i < (done ? 16 : 10); i++) {
          const ph = now * 0.6 + i * 1.7, c = cols[i % cols.length];
          let dx = Math.sin(ph * 1.3 + i) * 26, dy = 0;
          if (mo === 'rise') dy = -((ph * 14) % 48);
          else if (mo === 'fall') dy = ((ph * 16) % 56) - 40;
          else if (mo === 'orbit') { dx = Math.cos(ph) * 30; dy = Math.sin(ph) * 14 - 12; }
          else if (mo === 'twinkle') { dx = Math.sin(i * 12.9) * 34; dy = Math.cos(i * 7.7) * 26 - 8; }
          else dy = Math.sin(ph) * 10 - 18;
          g.globalAlpha = mo === 'twinkle' ? 0.35 + 0.65 * Math.abs(Math.sin(ph * 2)) : 0.85;
          g.fillStyle = c; g.fillRect(Math.round(cx + dx), Math.round(cy + dy), 3, 3);
        }
        g.globalAlpha = 1;
      }
    } catch (e) { /* cosmetic */ }
  },
});
register('system', 'sv4dTrads', {
  init(game) {
    game.bus.on('dayStart', () => { for (const t of TRADS) game.setFlag(`sv4d_trad_${t.id}_today`, !!get('npc', t.id) && check('date:' + TRAD_DATE[t.id], game)); });
  },
});
export { giveOr, flag };
