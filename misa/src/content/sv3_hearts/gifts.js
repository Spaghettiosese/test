// Gift depth: ten craftable handmade gifts (tag 'handmade') with a friendship bonus and wrapping flavour,
// plus a weekly Gift Day rotation (a themed gift each weekday earns bonus friendship).
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { S } from './core.js';

const H = (id, name, desc, shape, c, price, tags, ing, skill) => {
  register('item', id, { name, desc, cat: 'gift', price, icon: itemIcon(shape, { c, c2: '#fff6e6' }), tags: ['handmade', ...tags] });
  register('craft', 'craft_' + id, { name, ingredients: ing, out: id, n: 1, skill });
};
H('gift_handmade_bouquet', 'Handmade Bouquet', 'A bouquet you tied yourself with string. Flowers say it for you.', 'flower', '#f29aa0', 90, ['flower'], { 'tag:flower': 3, mat_string: 1 }, 0);
H('gift_handmade_card', 'Handmade Card', 'A folded card with ink doodles and a sincere message.', 'letter', '#f4e4c1', 45, ['paper'], { mat_paper: 1, mat_ink: 1 }, 0);
H('gift_handmade_scarf', 'Handmade Scarf', 'A slightly uneven, very warm scarf in your own pattern.', 'shirt', '#7fb2e0', 140, ['cozy'], { mat_yarn: 3 }, 1);
H('gift_handmade_bracelet', 'Handmade Bracelet', 'Little beads on a string, in a pattern only a friend would pick.', 'gem', '#e0707a', 110, ['jewel'], { mat_beads: 2, mat_string: 1 }, 1);
H('gift_handmade_cookies', 'Handmade Cookies', 'A tin of lopsided cookies baked with real effort.', 'sweet', '#d8a46a', 80, ['sweet', 'dish'], { ing_flour: 1, ing_sugar: 1, ing_butter: 1 }, 0);
H('gift_handmade_charm', 'Handmade Charm', 'A felt charm stitched with a tiny star. For luck.', 'star', '#ffd76a', 130, ['luck'], { mat_felt: 2, mat_string: 1 }, 2);
H('gift_handmade_bookmark', 'Handmade Bookmark', 'A washi paper bookmark with a pressed leaf.', 'paper', '#9ac8a0', 70, ['book'], { mat_washi: 1, mat_ink: 1 }, 1);
H('gift_handmade_frame', 'Handmade Frame', 'A small wooden frame with sanded edges and a little carved star.', 'box', '#c9935a', 120, ['decor'], { mat_wood: 2, mat_glue: 1 }, 2);
H('gift_handmade_candle', 'Handmade Candle', 'A honey candle that smells like a summer afternoon.', 'bottle', '#f0c860', 125, ['cozy'], { ing_honey: 2, mat_string: 1 }, 2);
H('gift_handmade_jar', 'Handmade Wishing Jar', 'A jar of beads and folded wishes, ready to give away.', 'bottle', '#7fd0d8', 160, ['sea_glass', 'luck'], { mat_glass: 1, mat_paper: 1, mat_beads: 1 }, 3);

export const WRAPS = [
  'wrapped in blue washi paper with a tiny star sticker',
  'tied up with a loop of red string and a hand-drawn tag',
  'tucked in a small paper bag decorated with doodled cats',
  'wrapped in a scrap of furoshiki cloth, knotted twice for luck',
  'in a box lined with pressed petals',
  'with a ribbon, a pinecone and a secret message inside the bow',
];
// Gift Day rotation: [name, tags, categories]
export const GIFT_DAYS = [
  ['Sweet Monday', ['sweet'], []],
  ['Bloom Tuesday', ['flower'], []],
  ['Handmade Wednesday', ['handmade'], []],
  ['Sea Thursday', ['fish', 'shell', 'sea_glass'], ['fish', 'shell']],
  ['Feast Friday', ['dish', 'bento', 'sandwich'], ['food']],
  ['Story Saturday', ['book'], ['book']],
  ['Tea Sunday', ['tea'], []],
];
export const giftDay = (g) => GIFT_DAYS[g.weekday];
export function matchesDay(item, day) {
  const it = get('item', item);
  return !!it && ((it.tags || []).some((t) => day[1].includes(t)) || day[2].includes(it.cat) || (day[1].includes('tea') && /^(bev|drink)_.*tea/.test(item)));
}

register('system', 'sv3Gifts', {
  init(game) {
    game.bus.on('dayStart', () => game.toast(`Gift Day: ${giftDay(game)[0]}!`, 'heart'));
    game.bus.on('gift', ({ npc, item, reaction }) => {
      const it = get('item', item), s = S(game).gift;
      if (!it) return;
      if ((it.tags || []).includes('handmade')) {
        const bonus = reaction === 'dislike' || reaction === 'hate' ? 30 : reaction === 'neutral' ? 35 : 25;
        game.addFriend(npc, bonus); game.stat('handmadeGifts'); s.handmade = (s.handmade || 0) + 1;
        const w = WRAPS[Math.floor(game.rngFor('wrap:' + item + npc)() * WRAPS.length)];
        game.toast(`Handmade: ${w}`, it.icon);
      }
      if (matchesDay(item, giftDay(game))) { game.addFriend(npc, 20); game.stat('giftDayGifts'); game.toast(`${giftDay(game)[0]} bonus!`, 'heart'); }
    });
    game.sv3 = Object.assign(game.sv3 || {}, { giftDay: () => giftDay(game)[0] });
  },
});

features('Relationships Deep', [
  'Ten handmade gifts you craft at the workbench (bouquet, card, scarf, bracelet, cookies, charm, bookmark, frame, candle and wishing jar)',
  'Handmade gifts earn bonus friendship, even from people who would normally dislike the item, and come with wrapping flavour text',
  'Weekly Gift Day rotation: Sweet Monday, Bloom Tuesday, Handmade Wednesday, Sea Thursday, Feast Friday, Story Saturday and Tea Sunday, each with a bonus for the matching gift',
]);
