// Integration gaps: items the cast's gift lists name, and the Kumo family recipes the story's menu arc hands out.
import { register, features } from '../core/registry.js';
import { itemIcon } from '../gfx/icons.js';
import { RAMPS as Rr } from '../gfx/palette.js';

const item = (id, name, cat, price, shape, c, desc, extra = {}) =>
  register('item', id, { name, cat, price, desc, icon: itemIcon(shape, { c, c2: extra.c2, c3: extra.c3 }), ...extra, c2: undefined, c3: undefined });

// ---- gifts people love
item('gift_sea_glass_blue', 'Blue sea glass', 'gift', 90, 'gem', Rr.sky[2], 'Worn smooth by the tide. It glows in the light.', { tags: ['sea_glass', 'mineral', 'gift'] });
item('gift_firefly_jar', 'Firefly jar', 'gift', 120, 'bottle', Rr.butter[3], 'A jar of soft little lights. Please let them go afterwards.', { tags: ['bug', 'gift'] });
item('gift_photo_mochi', 'Photo of Mochi', 'gift', 60, 'paper', Rr.sakura[2], 'Mochi mid-yawn. Dad will frame it, guaranteed.', { tags: ['gift', 'family'] });
item('gift_mochi_paw_print', 'Mochi paw print', 'gift', 70, 'paper', Rr.lilac[1], 'An inky paw print on a card. Nori will treasure it.', { tags: ['gift', 'art'] });
item('flower_sunflower', 'Sunflower', 'gift', 40, 'flower', Rr.butter[3], 'Tall, bright and a little goofy.', { tags: ['flower', 'gift'] });
item('flower_plum_blossom', 'Plum blossom', 'gift', 45, 'flower', Rr.sakura[1], 'A branch of early blossom. Smells like the end of winter.', { tags: ['flower', 'gift'] });

// ---- things people do not want (still sellable, mostly for pocket change)
item('gift_bug_spray', 'Bug spray', 'junk', 8, 'bottle', Rr.forest[3], 'Hina would like a word with whoever invented this.', { tags: ['junk'] });
item('gift_fake_charm', 'Fake charm', 'junk', 5, 'star', Rr.coral[2], 'Made in a factory. The kami can tell.', { tags: ['junk'] });
item('gift_loud_whistle', 'Loud whistle', 'junk', 10, 'tool', Rr.charcoal[2], 'Very, very loud.', { tags: ['junk'] });
item('gift_wilted_flower', 'Wilted flower', 'junk', 1, 'flower', Rr.woodDark[3], 'It had a good run.', { tags: ['junk'] });
item('toy_plastic', 'Plastic toy', 'junk', 6, 'toy', Rr.sky[1], 'Squeaks when you squeeze it, and when you do not.', { tags: ['junk', 'toy'] });
item('misc_crushed_can', 'Crushed can', 'junk', 2, 'tool', Rr.charcoal[3], 'Recycle it.', { tags: ['junk'] });
item('misc_fish_bones', 'Fish bones', 'junk', 1, 'fish', Rr.paper[3], 'Mochi would like these. Mika would not.', { tags: ['junk'] });
item('misc_mud', 'Mud', 'junk', 1, 'rock', Rr.woodDark[2], 'A handful of mud. For reasons.', { tags: ['junk'] });
item('misc_soggy_newspaper', 'Soggy newspaper', 'junk', 1, 'paper', Rr.paper[2], 'Yesterday\'s news, today\'s pulp.', { tags: ['junk'] });
item('misc_spoiled_food', 'Spoiled food', 'junk', 1, 'bowl', Rr.forest[1], 'Do not open the lid.', { tags: ['junk'] });
item('misc_weeds', 'Weeds', 'junk', 1, 'leafy', Rr.forest[2], 'Pulled from the garden. Goro will tell you which kind.', { tags: ['junk'] });

// ---- Mum's Kumo recipes (the story's "menu" arc finds the cards; game.learnRecipe teaches them)
const K = [
  ['honey_toast', 'Honey toast', 'bread', Rr.butter[3], { ing_bread: 1, ing_honey: 1, ing_butter: 1 }, 40, 12],
  ['veggie_curry', 'Garden curry', 'bowl', Rr.wood[3], { ing_curry: 1, ing_carrot: 1, ing_potato: 1, ing_onion: 1 }, 55, 12],
  ['sakura_scone', 'Sakura scone', 'sweet', Rr.sakura[2], { ing_flour: 1, ing_butter: 1, ing_sugar: 1 }, 40, 14],
  ['cloud_pancakes', 'Cloud pancakes', 'sweet', Rr.paper[4], { ing_flour: 1, ing_egg: 2, ing_milk: 1 }, 45, 14],
  ['melon_soda', 'Melon soda float', 'cup', Rr.mint[1], { ing_sugar: 1, ing_cream: 1, ing_mint: 1 }, 30, 14],
  ['pudding', 'Kumo pudding', 'sweet', Rr.butter[2], { ing_egg: 2, ing_milk: 1, ing_sugar: 1 }, 40, 16],
  ['omurice', 'Harbour omurice', 'plate', Rr.coral[2], { ing_rice: 1, ing_egg: 2, ing_tomato: 1 }, 60, 12],
  ['strawberry_sando', 'Strawberry sando', 'bread', Rr.ribbon[2], { ing_bread: 2, ing_strawberry: 2, ing_cream: 1 }, 45, 15],
  ['matcha_roll', 'Matcha roll', 'sweet', Rr.mint[2], { ing_matcha: 1, ing_egg: 2, ing_cream: 1, ing_sugar: 1 }, 40, 16],
  ['hojicha_float', 'Hojicha float', 'cup', Rr.woodDark[2], { ing_tea: 1, ing_cream: 1, ing_sugar: 1 }, 30, 14],
  ['cheesecake', 'Baked cheesecake', 'sweet', Rr.butter[4], { ing_cheese: 2, ing_egg: 2, ing_sugar: 1, ing_flour: 1 }, 50, 18],
  ['star_parfait', 'Star parfait', 'cup', Rr.lilac[2], { ing_cream: 1, ing_strawberry: 1, ing_yogurt: 1, ing_honey: 1 }, 45, 20],
];
for (const [k, name, shape, c, ingredients, energy, mood] of K) {
  const id = `dish_kumo_${k}`;
  register('item', id, { name, desc: 'One of Mum\'s Cafe Kumo recipes, written in her handwriting.', cat: 'food', price: 220, energy, mood, icon: itemIcon(shape, { c }), tags: ['dish', 'sweet', 'kumo'] });
  register('recipe', id, { name, ingredients, out: id, time: 25, steps: ['chop', 'stir', 'fry'], station: 'kitchen', learned: false, skill: null, from: null, hidden: false, story: true });
}

features('Integration', [
  '17 gift and junk items so every gift list in the cast resolves (sea glass, firefly jar, sunflower, mud...)',
  '12 Kumo family recipes that unlock through the story menu arc',
]);
