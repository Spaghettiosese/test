// The Moon Witch's cottage: interior map 'witch_cottage' (reached from Hoshi Woods once the ruin lanterns light the path), Madame Yui,
// the cauldron (potion brewing), her star-lore bookshelf (shop) and Yui's Requests (three one-time errands).
import { register, get, features } from '../../core/registry.js';
import { townMap, grid } from '../town/lib.js';
import { npc, sc, ch, open, leave, mood, time, backdrop } from '../social/util.js';
import { W2, POTIONS, LORE, clamp } from './data.js';
import './art.js';

const yui = (g) => W2(g).yui;
export const hasAll = (game, list) => list.every(([id, n]) => game.has(id, n));

// ---------------------------------------------------------------- brewing
export function brewCheck(game, id) {
  const rec = POTIONS[id], plan = [];
  for (const [alts, n] of rec.brew) {
    let need = n;
    for (const a of alts.slice().sort((x, y) => game.count(y) - game.count(x))) { const take = Math.min(need, game.count(a)); if (take > 0) { plan.push([a, take]); need -= take; } if (!need) break; }
    if (need) return null;
  }
  return plan;
}
const NEED_HEARTS = { potion_energy: 0, potion_swift: 0, potion_tea: 0, potion_luck: 2, potion_night: 3 };
export function brew(game, id) {
  const rec = POTIONS[id];
  if (game.hearts('yui') < NEED_HEARTS[id]) { game.toast(`Yui will teach you this at ${NEED_HEARTS[id]} hearts.`); return false; }
  const plan = brewCheck(game, id);
  if (!plan) { game.toast(`Needs: ${rec.hint}`); return false; }
  for (const [a, n] of plan) game.take(a, n);
  game.advance(30); game.sfx('pour');
  const n = 1 + (game.hearts('yui') >= 4 && game.rng() < 0.3 ? 1 : 0);
  game.give(id, n); yui(game).brewed[id] = (yui(game).brewed[id] || 0) + n; yui(game).potions += n;
  game.stat('potionsBrewed', n); game.addXP('crafting', 4); game.addXP('foraging', 2);
  game.bus.emit('potionBrewed', { id, n });
  game.toast(`Brewed ${n > 1 ? n + ' x ' : ''}${rec.name}${n > 1 ? ' (Yui\'s hands helped!)' : ''}`, get('item', id).icon);
  return true;
}
export function cauldronMenu(game) {
  const opts = Object.keys(POTIONS).map((id) => ({
    text: `${POTIONS[id].name}${game.hearts('yui') < NEED_HEARTS[id] ? ` (${NEED_HEARTS[id]} hearts)` : brewCheck(game, id) ? '' : ' (missing)'}`,
    steps: [{ t: 'call', fn: (g) => brew(g, id) }],
  }));
  return game.run([
    { t: 'say', who: null, text: 'The cauldron burbles in pale green. Pick a brew: it takes half an hour and the ingredients from your bag. Recipes: Energy tonic = 2 berries or nuts + 1 fern or moon herb. Swiftness = 2 green shoots + owl feather or tanuki leaf. Luck = star berry or glow cap + moon herb or ginseng + dust fluff. Night-sight = 2 mushrooms + moon herb. Moon tea = moon herb + a flower or shiso.' },
    { t: 'choice', prompt: 'Brew which potion?', options: [...opts, { text: 'Not now', steps: [] }] },
  ]);
}

// ---------------------------------------------------------------- Yui's Requests
export const REQS = [
  { id: 'r1', name: 'Moonlit tea', need: [['forage_moon_herb', 3]], when: 'flag:sw_yui_met', ask: 'Bring me three moon herbs from the woods after dark. They only open at night. I will make us a tea that tastes of tomorrow.', done: 'Perfect. Smell that. This one is for you. And a little something for your trouble.', give: { potion_luck: 1 }, coins: 400 },
  { id: 'r2', name: 'Feathers and leaves', need: [['mat_owl_feather', 2], ['mat_tanuki_leaf', 2]], when: 'flag:sw_req_r1', ask: 'My broom is balding and my hat is thin. Two owl feathers and two tanuki leaves, if the woods are feeling generous.', done: 'Ah, wonderful. The owls are in a good mood, then. Take this book, I have read it eleven times.', give: { book_star_lore_hearth: 1 }, coins: 600 },
  { id: 'r3', name: 'A cup of star water', need: [['mat_star_fragment', 3], ['ore_starfall', 1]], when: 'flag:sw_req_r2', ask: 'Deep below the mine the stars fall like rain. Bring me three star fragments and a lump of Starfall ore, and I will brew the rarest tea in the world.', done: 'You went all the way down. Hold out your hands. A prism shard: light that remembers every colour.', give: { min_prism_shard: 1 }, coins: 1500, stickers: 3 },
];
const nameOf = (id) => (get('item', id) || { name: id }).name;
const needText = (r) => r.need.map(([id, n]) => `${n} ${nameOf(id).toLowerCase()}`).join(' and ');
export const reqState = (game, r) => yui(game).req[r.id] || 0; // 0 not asked, 1 asked, 2 done
export const nextReq = (game) => REQS.find((r) => reqState(game, r) < 2 && game.check(r.when));
export function finishReq(game, r) {
  if (reqState(game, r) === 2 || !hasAll(game, r.need)) return false;
  for (const [id, n] of r.need) game.take(id, n);
  yui(game).req[r.id] = 2; game.setFlag('sw_req_' + r.id); game.stat('yuiRequests');
  game.addMoney(r.coins, true);
  for (const [id, n] of Object.entries(r.give)) { game.give(id, n, true); if (id.startsWith('min_')) { game.collect('mineral', id); game.bus.emit('mineralFound', { item: id }); } }
  if (r.stickers && game.giveStickers) game.giveStickers(r.stickers, 'Yui\'s request');
  game.addFriend('yui', 25); game.sfx('star');
  return true;
}
register('talkHook', 'sw_yui_requests', {
  npc: 'yui', priority: 30,
  when: (g) => { const r = nextReq(g); return !!r && (reqState(g, r) === 0 || hasAll(g, r.need)); },
  steps: (g) => {
    const r = nextReq(g) || REQS[0];
    if (reqState(g, r) === 1 && hasAll(g, r.need)) {
      return sc('yui', 'happy|Is that...? You remembered. ' + r.done, { t: 'call', fn: (gm) => finishReq(gm, r) }, `@Yui's Request complete: ${r.name}. (${r.coins} coins${r.stickers ? ' and Star Stickers' : ''} and a gift)`);
    }
    return sc('yui', `Misa. Might I ask a small favour? "${r.name}."`, r.ask,
      ch('Will you help?', ['Of course!', { t: 'call', fn: (gm) => { yui(gm).req[r.id] = 1; gm.toast(`Yui's Request: ${r.name}`, 'i_star'); } }, 'happy|Splendid. I will be here. I am always here. It is rather the point of a hermit.', 15], ['Not right now', 'Mm. The moon is patient. So am I, mostly.']));
  },
});

// ---------------------------------------------------------------- shop (star-lore books)
register('shop', 'sw_witch_books', {
  name: "Yui's Star-Lore Shelf", owner: 'yui', color: '#8f6ac0', buys: [],
  greet: { default: ['Read slowly. Books bite less that way.', 'These were all written by me, or by people who sound like me.'] }, thanks: ['A fine choice. Mind the margins, they whisper.'],
  stock: LORE.map(([id]) => id),
});

// ---------------------------------------------------------------- map
const G = grid(14, 10, '#');
G.fill(1, 2, 12, 7, '.'); G.fill(6, 9, 2, 1, 'd');
const noteText = (g) => { const r = nextReq(g); return r ? (reqState(g, r) === 1 ? `Yui's note: "${r.name}: ${needText(r)}."` : 'A note in tiny spiky writing: "Ask Madame Yui about her requests."') : 'The notes are all crossed out neatly. Every request is done.'; };
townMap('witch_cottage', {
  name: "Moon Witch's Cottage", outdoor: false, indoor: true, music: 'night', bg: '#1e1830',
  legend: { '#': 'wall_wood', '.': 'wood_dark', 'd': 'doorway' },
  rows: G.rows(),
  objects: [
    { spr: 'sw_rug_moon', x: 5, y: 6, w: 3, h: 2, flat: true, solid: false },
    { spr: 'sw_herb_shelf', x: 1, y: 2, w: 2, h: 1, shadow: 0, interact: { label: 'Look at the herbs', run: (g) => g.say(null, null, 'Jars labelled in spidery writing: DO NOT SMELL. SMELL ONLY IF SAD. PROBABLY FINE. A tiny jar of moonlight rattles when you tilt it.') } },
    { spr: 'sw_hanging_herbs', x: 4, y: 2, w: 2, h: 1, solid: false, dy: -4 },
    { spr: 'sw_hanging_herbs', x: 8, y: 2, w: 2, h: 1, solid: false, dy: -4 },
    { spr: 'sw_bookcase', x: 10, y: 2, w: 2, h: 1, shadow: 0, use: 'sw_books' },
    { spr: 'sw_cauldron', x: 6, y: 4, w: 1, h: 1, shadow: 17, use: 'sw_cauldron', light: { kind: 'lamp' } },
    { spr: 'sw_broom', x: 2, y: 5, solid: true, shadow: 5, interact: { label: 'Look at the broom', run: (g) => g.say('misa', 'surprised', 'The broom is leaning against the wall. I... think it just shifted a little when I looked away.') } },
    { spr: 'town_bush_flower', x: 11, y: 7, shadow: 8, interact: { label: 'Smell the flowers', run: (g) => g.say(null, null, 'Night-blooming flowers in a cracked teapot. They smell like clean sheets and something sweeter.') } },
    { spr: 'sw_banner', x: 3, y: 2, solid: false, dy: -2, shadow: 0, interact: { label: "Read Yui's notes", run: (g) => g.say(null, null, noteText(g)) } },
  ],
  warps: [{ x: 6, y: 9, w: 2, enter: 'down', to: 'hoshi_woods:from_witch_cottage' }],
  spawns: { default: [7, 8, 'up'], from_woods: [7, 8, 'up'] },
  spots: { cauldron: [6, 5, 'up'], desk: [10, 3, 'up'], door: [7, 8, 'down'], window: [9, 5, 'left'], rug: [6, 6] },
  onEnter(game) {
    if (!game.state.sv2_wild) return;
    if (!game.flag('sw_cottage_found')) {
      game.setFlag('sw_cottage_found'); game.setFlag('sw_yui_met');
      game.run(sc('yui', ...open('yui'),
        '@Warm lamplight, a bubbling cauldron, bundles of herbs hanging from every beam. A tall woman in a patched purple robe looks up from a book as if she has been expecting you for years.',
        'surprised|Ah. The lanterns found someone at last. They have been trying for ninety-one years. Come in, come in, mind the broom.',
        'I am Madame Yui. I brew, I read, and I do not leave. Most people say "witch". I say "very good at tea".',
        '>Misa! I... followed the lanterns. This place is amazing.',
        'happy|Of course it is. Here is how this works. The cauldron is yours: bring me what the woods give and I will teach you what to brew. The shelf is for books, and I keep a few... requests. Small ones.',
        'Stay as long as you like. Do not touch the jar marked PROBABLY FINE.', mood(8)));
    }
  },
});

register('interaction', 'sw_cauldron', { label: 'Use the cauldron', run: (g) => cauldronMenu(g) });
register('interaction', 'sw_books', { label: 'Browse star-lore books', run: (g) => g.run([{ t: 'shop', id: 'sw_witch_books' }]) });

// ---------------------------------------------------------------- Madame Yui
npc('yui', {
  name: 'Madame Yui', role: 'Moon Witch, hermit herbalist', color: '#8f6ac0',
  bio: 'Madame Yui: tall, silver-lilac hair in a loose braid, a patched purple robe and round glasses on a chain. Lives in a crooked cottage in Hoshi Woods. Dry humour, impeccable manners, and a long-running feud with her own broom.',
  look: { hair: '#d8d0ea', top: '#6a48b0', bottom: '#3a2a5a', skin: '#f2d6c0', eyes: '#6a4aa8', accent: '#ffd76a', shoe: '#2a1e3a' },
  birthday: { season: 'autumn', day: 13 },
  hint: 'rarely leaves her cottage deep in Hoshi Woods: you must light the ruin lanterns to find it. Brews at the cauldron mornings and evenings, reads at her bookcase in the afternoon.',
  schedule: [
    { when: 'flag:sw_cottage_found', stops: [{ at: '06:00', map: 'witch_cottage', spot: 'cauldron' }, { at: '12:00', map: 'witch_cottage', spot: 'desk' }, { at: '17:00', map: 'witch_cottage', spot: 'cauldron' }, { at: '23:00', map: 'witch_cottage', spot: 'window' }] },
    { stops: [{ at: '00:00', map: null }] },
  ],
  gifts: {
    love: ['forage_moon_herb', 'forage_wild_ginseng', 'min_moonstone', 'book_star_lore_sky'],
    like: ['forage_glow_cap', 'forage_star_berry', 'forage_matsutake', 'min_amethyst', 'forage_frost_fern', 'potion_luck'],
    dislike: ['fish_sardine', 'misc_weeds'],
    hate: ['fish_octopus'],
    likeTags: ['forage', 'tea'],
  },
  lines: {
    default: ['Mm? Oh, Misa. I was not ignoring you. I was ignoring everything else.', 'The woods remember everyone who is kind to them. It is a very long list and a very short one.', 'Never trust a tea that does not steam on a cold day. Or one that steams too much on a warm one.', 'happy|My broom insists it is a free spirit. I insist it is a broom. We are at an impasse.', 'There is a star for every kind of lonely. I have catalogued eleven. Ask me about the green one sometime.'],
    morning: ['Morning is for stirring and not talking. ...You may talk if you stir.', 'The cauldron wakes before I do. It is very smug about it.', 'Dew on the moon herb is useless. But I like to collect it anyway.'],
    evening: ['Evening is when the woods put their coats on. Hear the owls? They are saying hello. Or complaining.', 'Sit. The kettle has opinions and so do I.', 'The light through the shutters is the exact colour of the good tea.'],
    night: ['Night is the proper time to harvest moon herb. Everything else is amateur hour.', 'If a lantern blinks twice, wave back. It is only polite.'],
    rain: ['Rain on the roof. The best sound there is. It means nobody is coming.', 'happy|On rainy days the fish in the pond sing. Quietly. Do not tell them I told you.'],
    spring: ['Fiddleheads are up. I always say sorry to them first. It seems only fair.'],
    summer: ['The fireflies keep their own hours. I admire that.'],
    autumn: ['Glow caps in the dark soil. They are my favourite kind of lamp.'],
    winter: ['Frost ferns are rare. They only grow where it stays cold on purpose.'],
    at_witch_cottage: ['Do wipe your boots. The floor has feelings.', 'Welcome back. The lanterns told me you were coming, but they always say that.'],
    h2: ['You are not as loud as the others who found me. The others were loud. One was a goat.', 'I will teach you a luck draught, if you promise not to bet on horses.'],
    h4: ['happy|You stir clockwise now. Lovely. I may let you near the good ladle.', 'Not many people sit this quietly. It is a kind of magic.'],
    h6: ['If you ever need to find your way, follow the smallest light. It is never wrong, only sometimes inconvenient.', 'happy|I am glad the lanterns brought you. I would have gone looking myself, eventually.'],
    firstMeet: ['Ah. A visitor with mud on her shoes and wonder on her face. Come in.', 'You found the lanterns. Few do. Fewer still follow them to the end.'],
    birthday: ['happy|Another year of tea. You remembered? ...That is the nicest spell anyone has cast on me.'],
    gift_love: ['surprised|Moon herb, fresh? You did not! ...You did. I shall cry into the cauldron and make a very sentimental soup.', 'happy|Oh, this is wonderful. You have the eye of a proper herbalist.'],
    gift_like: ['happy|How thoughtful. This will make a lovely stew. Or a lovely curse, but a gentle one.', 'happy|Thank you. The woods raise good children.'],
    gift_neutral: ['Hm. Thank you. I will find a use for it. I find a use for everything.'],
    gift_dislike: ['...I will put this somewhere the broom cannot find it.'],
    gift_hate: ['No. No no no. Out. Out of the cottage. The cauldron is already offended.'],
    greet: ['Welcome.', 'Ah. Misa.', 'Come in. Mind the broom.'],
    catchup: ['The woods said you had been away. I pretended not to listen.'],
    giftBack: ['A little pouch of dried moon herb. For your pillow. Do not ask me what it does.'],
    textReply: ['(Text) The owl read your message first. It had notes.'],
  },
  events: [
    { id: 'yui_h2', hearts: 2, map: 'witch_cottage', when: 'time>=9:00&time<19:00',
      thanks: 'The teacups have been returned to their shelf, mostly. Thank you for your steady hands.',
      script: () => sc('yui', ...open('yui'),
        'Misa. You have steady hands. I require steady hands. The cauldron is making a Tea of Remembering and the teacups keep floating off.',
        '@A row of little cups hovers at head height, bumping gently against the beams like sleepy moths.',
        ch('How do you catch them?',
          ['Slowly, one at a time', '@You coax each cup down with a flat palm. They settle with soft clinks.', 'happy|Patience. The oldest magic of all.', 25],
          ['Wave the broom at them', '@The broom shoots out of your hands, herds every cup into the corner and returns, looking smug.', 'surprised|...It has never done that for me. Traitor.', 25],
          ['Join in and float too', '*>music', '@You leap up and wobble in the air a half second. The cups chime in applause.', 'happy|Ha! Oh, that is the first time I have laughed in the cottage in a year.', 30]),
        '@You each drink a cup of the tea. It tastes like the first warm day of spring and a little like the smell of your grandmother\'s house.', 'Thank you, Misa.', time(60), mood(10), leave('yui')) },
    { id: 'yui_h5', hearts: 5, map: 'hoshi_woods', when: 'time>=21:00',
      thanks: 'The moon blossoms bloom only for those who walk quietly. I am glad it was you.',
      script: () => sc('yui', backdrop('soc_stars'), '@A clearing in Hoshi Woods at night. Fireflies and mist. The moon sits low between two cedars.', backdrop(null), ...open('yui'),
        'Come. There is a thing I show perhaps one person a decade. Quietly, now. The woods are shy.',
        '@She kneels by a patch of dark moss and lays a hand on the ground. Slowly, one by one, pale flowers open, each with a tiny glowing heart.',
        'Moon blossoms. They open once a year for a few minutes. I have watched them for forty years and I still hold my breath.',
        ch('What do you say?',
          ['They are beautiful', 'happy|They are. And so, I think, are you for staying quiet. Thank you for that.', 30],
          ['Why show me?', 'Because you listened when nobody asked you to. That is the whole spell, Misa. All of it.', 35],
          ['Say nothing and watch', '@You sit beside her, and the flowers glow brighter, as if the quiet were a kind of water.', 'happy|...Exactly. You understand.', 40]),
        '@When the last bloom fades she presses a dried one into your hand. It still glows faintly.', 'Keep it. When you are very tired, hold it. It remembers this night, and it will remind you.',
        { t: 'call', fn: (g) => { g.give('forage_ruin_blossom', 1, true); g.toast('Yui gave you a glowing blossom', 'heart'); } }, time(60), mood(18), leave('yui')) },
  ],
  social: { free: () => 'home', busy: { home: 'The woods bend and the paths forget themselves. I do not go out. You are always welcome in.' } },
});

features('Wild Places', [
  'Moon Witch\'s cottage: a cosy purple-roofed interior deep in the woods with a bubbling cauldron, herb shelf, bookcase and a rug stitched with the moon',
  'The cottage appears and its door opens only after the ruin lanterns are lit; the first visit is a scene with Madame Yui',
  'Madame Yui: reclusive herbalist and witch with a full social profile (schedule at the cauldron, desk and window, gifts, lines for every context)',
  'Yui heart events: the floating teacups at 2 hearts and the night of the moon blossoms at 5 hearts',
  'Cauldron brewing: energy tonic restores 60 energy, swiftness brew speeds your feet for 4 hours',
  'Luck draught (2 hearts): a lucky buff and extra daily luck; night-sight elixir (3 hearts): dark places glow and night forage improves',
  'Yui\'s hands help at 4 hearts: sometimes a brew makes two potions',
  'Moon tea: a moon herb and a flower brew a cup of calm that lifts mood and energy by 25',
  'The night-sight elixir also warms the screen with a golden glow after dark',
  'Yui loves moon herb, wild ginseng and moonstone, and has her birthday on Autumn 13',
  'Star-lore books at Yui\'s shelf (five titles): reading one gives a big boost to Foraging, Mining, Fishing, Homemaking or Study XP',
  'Yui\'s Requests: three one-time errands (moon herb, owl feathers and tanuki leaves, Starfall star water) that unlock in order with coins and rare gifts',
  'A pinned note in the cottage tells you what Yui is waiting for',
]);
void clamp;
