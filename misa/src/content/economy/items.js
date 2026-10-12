// Economy area: the general item catalogue (shop goods, ingredients, materials, gifts, books, tools, Star Stickers).
// Item schema (engine fields): name, desc, cat, price (sell value), icon, energy?, mood?, tags?, key?, use?(game)
// Economy extras read by shops and the price system:
//   buy      shop price before modifiers (default: about 2.2x the sell value)
//   seasons  ['spring', ...] produce in season is cheaper to buy and a little cheaper to sell
//   buff     id from BUFFS (core.js), applied when the item is eaten or drunk
//   tier     tool tier 1-3 (tools.js readers in hobbies decide what tiers do)
//   skillBook { skill, xp } read once from the bag for skill XP
//   shop / shops   other areas may tag their own items with shop ids to have them stocked automatically
// Id prefixes (economy): ing_ mat_ gift_ book_ tool_ toy_ snack_ bev_ food_ furn_star_ cloth_star_ star_sticker.
import { register, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS } from '../../gfx/palette.js';
import './icons.js';

const Rr = RAMPS;
const round5 = (n) => (n < 20 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5);
export const ECON_ITEMS = [];
function add(id, name, cat, buy, shape, c, extra = {}) {
  const { c2, c3, sell, ...rest } = extra;
  const def = { name, cat, buy, price: sell ?? round5(buy * 0.45), icon: itemIcon(shape, { c, c2, c3 }), ...rest };
  if (!def.desc) def.desc = '';
  register('item', id, def);
  ECON_ITEMS.push(id);
  return def;
}

// ---------------------------------------------------------------- ingredients (cooking uses these)
const ING = (id, name, buy, shape, c, desc, extra = {}) => add(id, name, 'food', buy, shape, c, { desc, tags: ['ingredient', ...(extra.tags || [])], ...extra, ...(extra.tags ? { tags: ['ingredient', ...extra.tags] } : {}) });
ING('ing_rice', 'Rice', 60, 'sack', Rr.paper[4], 'A small sack of short-grain rice. The start of every good meal.', { c3: Rr.coral[2], tags: ['staple'] });
ING('ing_egg', 'Eggs', 30, 'egg', Rr.butter[3], 'Six fresh eggs from a farm up the hill.', { tags: ['dairy'] });
ING('ing_flour', 'Flour', 40, 'sack', Rr.paper[3], 'Soft flour for bread, cakes and pancakes.', { c3: Rr.sky[2], tags: ['baking'] });
ING('ing_sugar', 'Sugar', 35, 'sack', '#fffaf0', 'Sweet white sugar. Hide it from Mochi.', { c3: Rr.hairPink[2], tags: ['sweet', 'baking'] });
ING('ing_milk', 'Milk', 30, 'carton', Rr.sky[2], 'A cold carton of milk.', { tags: ['dairy'], energy: 8 });
ING('ing_butter', 'Butter', 45, 'bar', Rr.butter[3], 'A block of salted butter.', { c3: Rr.paper[4], tags: ['dairy', 'baking'] });
ING('ing_tea', 'Green tea leaves', 50, 'jar', Rr.forest[3], 'Loose sencha leaves in a tin.', { c3: Rr.forest[1], tags: ['tea'] });
ING('ing_coffee', 'Coffee beans', 70, 'sack', Rr.woodDark[3], 'Dark roasted beans. They smell like Ms. Fujita\'s office.', { c3: Rr.paper[3], tags: ['coffee'] });
ING('ing_matcha', 'Matcha powder', 90, 'jar', Rr.mint[1], 'Bright green powdered tea for lattes and sweets.', { c3: Rr.forest[3], tags: ['tea'] });
ING('ing_tofu', 'Tofu', 30, 'box', Rr.paper[4], 'Silken tofu, soft as a cloud.', { c2: Rr.paper[2], tags: ['protein'] });
ING('ing_miso', 'Miso paste', 45, 'jar', Rr.wood[2], 'Rich fermented soybean paste for soup.', { c3: Rr.butter[3] });
ING('ing_soy', 'Soy sauce', 40, 'bottle', Rr.woodDark[1], 'A bottle of soy sauce. Salty and savoury.', { c2: Rr.coral[1], tags: ['seasoning'] });
ING('ing_salt', 'Salt', 15, 'jar', '#fffaf0', 'Sea salt from Hoshimori Bay.', { c3: Rr.sky[2], tags: ['seasoning'] });
ING('ing_oil', 'Cooking oil', 35, 'bottle', Rr.butter[3], 'Golden oil for frying.', { c2: Rr.butter[1], tags: ['seasoning'] });
ING('ing_noodles', 'Noodles', 40, 'box', Rr.butter[4], 'A pack of dried noodles.', { c2: Rr.coral[2] });
ING('ing_nori', 'Nori sheets', 35, 'box', Rr.forest[0], 'Crisp sheets of dried seaweed for onigiri.', { c2: Rr.forest[1] });
ING('ing_red_bean', 'Red bean paste', 55, 'jar', Rr.coral[0], 'Sweet anko for mochi, taiyaki and buns.', { c3: Rr.paper[4], tags: ['sweet'] });
ING('ing_mochiko', 'Mochiko flour', 50, 'sack', Rr.paper[4], 'Sweet rice flour that turns into chewy mochi.', { c3: Rr.hairPink[3], tags: ['baking'] });
ING('ing_honey', 'Honey', 80, 'jar', Rr.butter[2], 'A jar of wildflower honey from Goro\'s friend.', { c3: Rr.butter[1], tags: ['sweet'] });
ING('ing_strawberry', 'Strawberries', 70, 'berry', Rr.ribbon[2], 'A punnet of fresh strawberries. Mika\'s favourite.', { tags: ['fruit', 'sweet'], seasons: ['spring'], energy: 6 });
ING('ing_lemon', 'Lemon', 25, 'fruit', Rr.butter[2], 'Sour and sunny.', { tags: ['fruit'], seasons: ['summer'] });
ING('ing_chocolate', 'Baking chocolate', 60, 'bar', Rr.woodDark[2], 'Dark chocolate for melting into desserts.', { c3: Rr.coral[2], tags: ['sweet', 'baking'] });
ING('ing_cheese', 'Cheese', 70, 'box', Rr.butter[3], 'A wedge of mild cheese.', { c2: Rr.butter[1], tags: ['dairy'] });
ING('ing_bread', 'Bread loaf', 50, 'bread', Rr.wood[3], 'A soft white loaf for toast and sandwiches.', { tags: ['baking'], energy: 10 });
ING('ing_curry', 'Curry roux', 55, 'bar', Rr.wood[2], 'Blocks of mild curry roux. Smells like Friday.', { c3: Rr.butter[2] });
ING('ing_carrot', 'Carrot', 20, 'root', Rr.hairGinger[2], 'Crunchy and orange.', { tags: ['vegetable'], seasons: ['spring', 'autumn'] });
ING('ing_potato', 'Potato', 20, 'rock', Rr.dirt[3], 'A dusty potato, perfect for curry.', { tags: ['vegetable'], seasons: ['autumn'] });
ING('ing_onion', 'Onion', 15, 'fruit', Rr.paper[2], 'It might make you cry a little.', { tags: ['vegetable'] });
ING('ing_cabbage', 'Cabbage', 30, 'leafy', Rr.forest[3], 'A round green cabbage.', { tags: ['vegetable'], seasons: ['winter', 'spring'] });
ING('ing_tomato', 'Tomato', 25, 'fruit', Rr.ribbon[2], 'Ripe and red. Mr. Ogawa grows giant ones.', { tags: ['vegetable'], seasons: ['summer'], energy: 4 });
ING('ing_fish_flakes', 'Bonito flakes', 45, 'sack', Rr.wood[3], 'Shaved dried bonito for dashi. Mochi goes wild for it.', { c3: Rr.coral[2] });
ING('ing_cream', 'Whipped cream', 50, 'carton', '#fffaf0', 'Fluffy cream for cakes and parfaits.', { c2: Rr.hairPink[3], tags: ['dairy', 'sweet'] });
ING('ing_vanilla', 'Vanilla bean', 90, 'feather', Rr.woodDark[2], 'A fragrant vanilla pod. A little goes a long way.', { tags: ['sweet', 'baking'] });
ING('ing_peach', 'Peach', 45, 'fruit', Rr.coral[3], 'Fuzzy, juicy and very summery.', { tags: ['fruit', 'sweet'], seasons: ['summer'], energy: 8 });
ING('ing_apple', 'Apple', 30, 'fruit', Rr.ribbon[2], 'A crisp red apple.', { tags: ['fruit'], seasons: ['autumn'], energy: 8 });
ING('ing_ginger', 'Ginger root', 25, 'root', Rr.sand[2], 'Spicy, warming ginger.', { c3: Rr.sand[1], tags: ['seasoning'] });
ING('ing_sesame', 'Sesame seeds', 30, 'jar', Rr.paper[3], 'Toasted sesame for sprinkling on everything.', { c3: Rr.wood[2], tags: ['seasoning'] });
ING('ing_mushroom', 'Shiitake', 35, 'mushroom', Rr.wood[2], 'Meaty shiitake mushrooms.', { tags: ['vegetable'], seasons: ['autumn'] });
ING('ing_cucumber', 'Cucumber', 20, 'root', Rr.forest[2], 'Cool and crunchy. Daifuku likes the slices.', { c3: Rr.forest[1], tags: ['vegetable'], seasons: ['summer'] });
ING('ing_spinach', 'Spinach', 25, 'leafy', Rr.forest[2], 'A bunch of dark leafy greens.', { tags: ['vegetable'], seasons: ['spring', 'winter'] });
ING('ing_corn', 'Sweet corn', 30, 'root', Rr.butter[2], 'Grilled corn is a summer festival must.', { c3: Rr.forest[3], tags: ['vegetable'], seasons: ['summer'] });
ING('ing_pumpkin', 'Kabocha squash', 45, 'fruit', Rr.forest[1], 'Sweet Japanese pumpkin.', { tags: ['vegetable'], seasons: ['autumn', 'winter'] });
ING('ing_chicken', 'Chicken', 80, 'box', Rr.coral[3], 'Chicken thighs for karaage.', { c2: Rr.paper[4], tags: ['protein'] });
ING('ing_shrimp', 'Shrimp', 90, 'shell', Rr.coral[3], 'A handful of pink shrimp.', { tags: ['protein', 'seafood'] });
ING('ing_dashi', 'Dashi stock', 40, 'bottle', Rr.sand[2], 'Kelp and bonito broth, ready to use.', { c2: Rr.wood[2] });
ING('ing_mirin', 'Mirin', 45, 'bottle', Rr.butter[3], 'Sweet rice wine for cooking (the alcohol cooks off).', { c2: Rr.coral[2], tags: ['seasoning'] });
ING('ing_vinegar', 'Rice vinegar', 30, 'bottle', '#fffaf0', 'For sushi rice and pickles.', { c2: Rr.sky[2], tags: ['seasoning'] });
ING('ing_cinnamon', 'Cinnamon', 60, 'jar', Rr.wood[1], 'Warm spice for apple pie and winter drinks.', { c3: Rr.wood[3], tags: ['baking'] });
ING('ing_mint', 'Fresh mint', 30, 'leafy', Rr.mint[2], 'A sprig of cool mint.', { tags: ['herb'] });
ING('ing_yogurt', 'Yogurt', 40, 'jar', '#fffaf0', 'Plain creamy yogurt.', { c3: Rr.hairPink[3], tags: ['dairy'] });
ING('ing_umeboshi', 'Umeboshi', 50, 'jar', Rr.ribbon[1], 'Pickled plums. Very sour. Goro loves them.', { c3: Rr.ribbon[2] });
ING('ing_kelp', 'Kombu', 40, 'leafy', Rr.forest[0], 'Dried kelp for stock.', { c2: Rr.forest[1] });

// ---------------------------------------------------------------- snacks (ready to eat)
const SNACK = (id, name, buy, energy, shape, c, desc, extra = {}) => add(id, name, 'food', buy, shape, c, { desc, energy, ...extra, tags: ['snack', ...(extra.tags || [])] });
SNACK('snack_rice_crackers', 'Rice crackers', 60, 12, 'plate', Rr.wood[3], 'Crunchy senbei glazed with soy. Grandma always had a tin.', { tags: [] });
SNACK('snack_melon_bread', 'Melon bread', 120, 22, 'bread', Rr.mint[3], 'A sweet bun with a crackly cookie top.', { tags: ['sweet', 'bread'] });
SNACK('snack_curry_bread', 'Curry bread', 140, 26, 'bread', Rr.wood[2], 'Fried bread with curry inside. Kai would trade anything for one.', { tags: ['bread'] });
SNACK('snack_onigiri_salmon', 'Salmon onigiri', 110, 20, 'onigiri', Rr.coral[3], 'A rice ball with grilled salmon inside.', { tags: ['onigiri'] });
SNACK('snack_onigiri_ume', 'Plum onigiri', 100, 18, 'onigiri', Rr.ribbon[2], 'A rice ball with a sour umeboshi heart.', { tags: ['onigiri'] });
SNACK('snack_potato_chips', 'Potato chips', 90, 10, 'box', Rr.butter[2], 'Salty, crunchy and gone too fast.', { c2: Rr.coral[2], tags: ['junk'] });
SNACK('snack_pudding', 'Custard pudding', 130, 16, 'cup', Rr.butter[2], 'Wobbly caramel pudding from the chiller.', { tags: ['sweet'] });
SNACK('snack_limited_pudding', 'Limited pudding', 260, 24, 'cup', Rr.lilac[2], 'A seasonal pudding in a fancy jar. Kiko lines up for these.', { tags: ['sweet', 'rare'] });
SNACK('snack_choco_bar', 'Chocolate bar', 100, 14, 'bar', Rr.woodDark[3], 'Milk chocolate in shiny foil.', { c3: Rr.ribbon[2], tags: ['sweet'] });
SNACK('snack_candy', 'Fruit candy', 40, 5, 'sweet', Rr.hairPink[2], 'A twist of fruit candy.', { tags: ['sweet', 'junk'] });
SNACK('snack_cookies', 'Butter cookies', 150, 18, 'plate', Rr.butter[3], 'A box of buttery cookies with jam centres.', { tags: ['sweet'] });
SNACK('snack_dango', 'Dango', 120, 18, 'berry', Rr.hairPink[3], 'Three chewy rice dumplings on a stick.', { tags: ['sweet', 'wagashi'] });
SNACK('snack_taiyaki', 'Taiyaki', 140, 20, 'fish', Rr.wood[3], 'A fish-shaped cake full of warm red bean.', { tags: ['sweet', 'wagashi'] });
SNACK('snack_sandwich', 'Egg sandwich', 160, 26, 'bread', Rr.butter[3], 'Fluffy egg salad in soft white bread. Pip\'s favourite kind.', { tags: ['sandwich'] });
SNACK('snack_macarons', 'Macarons', 280, 16, 'sweet', Rr.lilac[3], 'Six pastel macarons in a little box.', { c2: Rr.hairPink[2], tags: ['sweet', 'cute', 'fancy'] });
SNACK('snack_sakura_mochi', 'Sakura mochi', 160, 18, 'sweet', Rr.sakura[3], 'Pink mochi wrapped in a salted cherry leaf.', { c2: Rr.forest[2], tags: ['sweet', 'wagashi'], seasons: ['spring'] });
SNACK('snack_honey_toast', 'Honey toast', 180, 24, 'bread', Rr.butter[2], 'Thick toast dripping with honey and butter.', { tags: ['sweet', 'bread'] });
SNACK('snack_banana', 'Banana', 50, 10, 'root', Rr.butter[3], 'A snack that comes in its own wrapper.', { c3: Rr.butter[1], tags: ['fruit'] });
SNACK('snack_strawberry_shortcake', 'Strawberry shortcake', 320, 26, 'cake', Rr.ribbon[2], 'Sponge, cream and strawberries. Rina pretends not to love it.', { c3: Rr.paper[3], tags: ['sweet', 'cake', 'fancy'], buff: 'cozy' });
SNACK('snack_cheesecake', 'Cheesecake', 300, 24, 'cake', Rr.butter[3], 'Baked cheesecake with a buttery crust.', { c3: Rr.wood[3], tags: ['sweet', 'cake'], buff: 'cozy' });
SNACK('snack_choco_cake', 'Chocolate cake', 300, 26, 'cake', Rr.woodDark[3], 'Rich layered chocolate cake.', { c3: Rr.woodDark[2], tags: ['sweet', 'cake'], buff: 'cozy' });
SNACK('snack_matcha_roll', 'Matcha roll cake', 300, 24, 'cake', Rr.mint[2], 'Swiss roll with matcha cream.', { c3: Rr.forest[3], tags: ['sweet', 'cake'], buff: 'cozy' });
SNACK('snack_pancakes', 'Fluffy pancakes', 360, 34, 'plate', Rr.butter[3], 'A wobbly stack of souffle pancakes.', { tags: ['sweet'], buff: 'cozy' });
SNACK('snack_ice_strawberry', 'Strawberry shaved ice', 200, 14, 'icecup', Rr.ribbon[2], 'Fluffy ice with strawberry syrup.', { c2: Rr.ribbon[1], tags: ['sweet', 'cold'], buff: 'cool' });
SNACK('snack_ice_melon', 'Melon shaved ice', 200, 14, 'icecup', Rr.mint[2], 'Bright green melon syrup over snowy ice.', { c2: Rr.mint[1], tags: ['sweet', 'cold'], buff: 'cool' });
SNACK('snack_ice_blue', 'Blue Hawaii ice', 200, 14, 'icecup', Rr.sky[2], 'Nobody knows what flavour blue is. Everyone loves it.', { c2: Rr.sky[1], tags: ['sweet', 'cold'], buff: 'cool' });
SNACK('snack_ice_matcha', 'Matcha azuki ice', 260, 18, 'icecup', Rr.forest[3], 'Matcha syrup, red beans and condensed milk.', { c2: Rr.forest[2], tags: ['sweet', 'cold'], buff: 'cool' });
SNACK('snack_ice_lemon', 'Lemon shaved ice', 200, 14, 'icecup', Rr.butter[3], 'Sharp, sweet and cooling.', { c2: Rr.butter[2], tags: ['sweet', 'cold'], buff: 'cool' });

// ---------------------------------------------------------------- drinks
const BEV = (id, name, buy, energy, shape, c, desc, extra = {}) => add(id, name, 'food', buy, shape, c, { desc, energy, ...extra, tags: ['drink', ...(extra.tags || [])] });
BEV('bev_water', 'Mineral water', 100, 6, 'bottle', Rr.sky[3], 'Cold, clear and simple.', { c2: Rr.sky[1] });
BEV('bev_green_tea', 'Bottled green tea', 120, 8, 'bottle', Rr.forest[3], 'Crisp unsweetened green tea.', { c2: Rr.forest[1], tags: ['tea'], buff: 'calm' });
BEV('bev_barley_tea', 'Barley tea', 120, 8, 'bottle', Rr.wood[3], 'Toasty mugicha, the taste of summer break.', { c2: Rr.wood[1], tags: ['tea'] });
BEV('bev_sports_drink', 'Sports drink', 130, 12, 'bottle', Rr.sky[2], 'Electrolytes! Kai drinks three a day.', { c2: '#fffaf0', tags: ['sporty'] });
BEV('bev_ramune', 'Ramune', 120, 8, 'bottle', Rr.water[4], 'Fizzy lemonade with a marble in the neck.', { c2: Rr.sky[1], tags: ['sweet', 'cold'] });
BEV('bev_milk_tea', 'Royal milk tea', 140, 10, 'can', Rr.sand[3], 'Sweet milky tea in a can.', { c3: Rr.wood[2], tags: ['tea', 'sweet'] });
BEV('bev_can_coffee', 'Canned coffee', 120, 8, 'can', Rr.woodDark[2], 'Hot from the machine in winter, cold in summer.', { c3: Rr.butter[2], tags: ['coffee'], buff: 'perk' });
BEV('bev_energy_drink', 'Energy drink', 220, 25, 'can', Rr.forest[3], 'Fizzy and very green. Suzu says it tastes like batteries.', { c3: Rr.butter[2], tags: ['junk'], buff: 'perk' });
BEV('bev_lemonade', 'Lemonade', 160, 10, 'cup', Rr.butter[3], 'Fresh lemonade with a mint leaf.', { tags: ['sweet', 'cold'] });
BEV('bev_cocoa', 'Hot cocoa', 150, 12, 'cup', Rr.woodDark[3], 'Thick hot chocolate with a marshmallow.', { tags: ['sweet', 'warm'], buff: 'cozy' });
BEV('bev_corn_soup', 'Corn potage can', 130, 14, 'can', Rr.butter[2], 'Hot corn soup from a vending machine. A winter classic.', { c3: Rr.butter[4], tags: ['warm'] });
BEV('bev_melon_soda', 'Melon soda', 130, 8, 'bottle', Rr.mint[2], 'Bright green, very fizzy.', { c2: Rr.mint[1], tags: ['sweet', 'cold'] });
BEV('bev_latte', 'Cafe latte', 300, 16, 'cup', Rr.sand[3], 'Kumo-chan\'s smooth latte with a foam heart.', { tags: ['coffee', 'cafe'], buff: 'perk' });
BEV('bev_matcha_latte', 'Matcha latte', 340, 16, 'cup', Rr.mint[2], 'Creamy matcha latte. Theo orders it every time.', { tags: ['tea', 'cafe'], buff: 'calm' });
BEV('bev_black_coffee', 'Black coffee', 260, 12, 'cup', Rr.woodDark[1], 'Strong, dark and to the point. Ms. Fujita\'s fuel.', { tags: ['coffee', 'cafe'], buff: 'perk' });
BEV('bev_earl_grey', 'Earl Grey tea', 280, 10, 'cup', Rr.wood[2], 'Bergamot black tea in a china cup. Tobias approves.', { tags: ['tea', 'cafe'], buff: 'calm' });
BEV('bev_jasmine_tea', 'Jasmine tea', 280, 10, 'cup', Rr.butter[4], 'Delicate flowery tea. Suzu\'s favourite.', { tags: ['tea', 'cafe'], buff: 'calm' });
BEV('bev_strawberry_milk', 'Strawberry milk', 260, 14, 'cup', Rr.hairPink[3], 'Pink, sweet and frothy.', { tags: ['sweet', 'cafe', 'cute'], buff: 'cozy' });
BEV('bev_vitamin_drink', 'Vitamin drink', 300, 30, 'bottle', Rr.butter[2], 'Dr. Mori\'s recommendation for tired students.', { c2: Rr.coral[2], tags: ['health'], buff: 'perk' });

// ---------------------------------------------------------------- meals (stands and Sunny Mart bento)
const MEAL = (id, name, buy, energy, shape, c, desc, extra = {}) => add(id, name, 'food', buy, shape, c, { desc, energy, ...extra, tags: ['meal', ...(extra.tags || [])] });
MEAL('food_shoyu_ramen', 'Shoyu ramen', 600, 50, 'bowl', Rr.wood[2], 'Clear soy broth, springy noodles, a soft egg.', { c3: Rr.butter[3], tags: ['ramen', 'warm'] });
MEAL('food_miso_ramen', 'Miso ramen', 650, 55, 'bowl', Rr.butter[1], 'Hearty miso broth with corn and butter.', { c3: Rr.butter[3], tags: ['ramen', 'warm'] });
MEAL('food_spicy_ramen', 'Spicy ramen', 700, 55, 'bowl', Rr.ribbon[2], 'Fiery red broth. Kai\'s favourite. Grandma\'s nightmare.', { c3: Rr.butter[3], tags: ['ramen', 'spicy', 'warm'] });
MEAL('food_gyoza', 'Gyoza', 400, 30, 'plate', Rr.butter[3], 'Six crispy pan-fried dumplings.', { tags: ['warm'] });
MEAL('food_kitsune_udon', 'Kitsune udon', 500, 45, 'bowl', Rr.butter[2], 'Thick udon topped with sweet fried tofu.', { c3: Rr.paper[4], tags: ['noodles', 'warm'] });
MEAL('food_tempura_udon', 'Tempura udon', 650, 50, 'bowl', Rr.butter[3], 'Udon with a crunchy shrimp tempura.', { c3: Rr.coral[3], tags: ['noodles', 'warm'] });
MEAL('food_zaru_soba', 'Zaru soba', 500, 40, 'plate', Rr.woodDark[3], 'Cold buckwheat noodles with dipping sauce.', { tags: ['noodles', 'cold'] });
MEAL('food_yakisoba', 'Yakisoba', 450, 42, 'plate', Rr.wood[2], 'Fried noodles with cabbage and a tangy sauce.', { tags: ['noodles'] });
MEAL('food_karaage_bento', 'Karaage bento', 550, 48, 'box', Rr.butter[1], 'Fried chicken, rice and pickles. Pip loves these.', { c2: Rr.coral[1], tags: ['bento'] });
MEAL('food_salmon_bento', 'Salmon bento', 550, 45, 'box', Rr.coral[3], 'Grilled salmon, rice, tamagoyaki.', { c2: Rr.coral[1], tags: ['bento'] });
MEAL('food_veggie_bento', 'Garden bento', 480, 40, 'box', Rr.forest[3], 'Rice with seasonal vegetables and tofu.', { c2: Rr.forest[1], tags: ['bento'] });
MEAL('food_oden', 'Oden cup', 380, 32, 'bowl', Rr.sand[2], 'Daikon, eggs and fishcake simmered for hours.', { c3: Rr.paper[4], tags: ['warm'], seasons: ['autumn', 'winter'] });

// ---------------------------------------------------------------- materials (crafting, repairs, fishing bait)
const MAT = (id, name, buy, shape, c, desc, extra = {}) => add(id, name, 'material', buy, shape, c, { desc, ...extra });
MAT('mat_wood', 'Wood plank', 60, 'furniture', Rr.wood[2], 'A smooth pine plank for building things.');
MAT('mat_cloth', 'Cotton cloth', 70, 'box', Rr.sky[3], 'A folded length of patterned cotton.', { c2: Rr.sky[2] });
MAT('mat_yarn', 'Yarn', 60, 'berry', Rr.coral[2], 'A soft ball of wool yarn.', { tags: ['knit'] });
MAT('mat_rainbow_wool', 'Rainbow wool', 600, 'berry', Rr.lilac[2], 'Hand-dyed yarn in every colour. Grandma Hana would treasure it.', { tags: ['knit', 'rare'] });
MAT('mat_paper', 'Craft paper', 40, 'paper', Rr.sky[2], 'Coloured paper for folding and cutting.', { tags: ['paper'] });
MAT('mat_washi', 'Washi tape', 80, 'ticket', Rr.hairPink[3], 'Patterned paper tape. Makes anything cuter.', { tags: ['paper', 'cute'] });
MAT('mat_paint', 'Paint set', 200, 'box', Rr.butter[3], 'Twelve little pots of paint.', { c2: Rr.coral[2], tags: ['art'] });
MAT('mat_ink', 'Fancy ink', 350, 'bottle', Rr.lilac[1], 'Shimmering fountain-pen ink. Aunt Nori adores it.', { c2: Rr.lilac[3], tags: ['art', 'fancy'] });
MAT('mat_string', 'String', 30, 'feather', Rr.paper[3], 'A coil of strong string.');
MAT('mat_glue', 'Glue', 40, 'bottle', '#fffaf0', 'Sticks almost anything.', { c2: Rr.coral[2] });
MAT('mat_wire', 'Copper wire', 70, 'feather', Rr.hairGinger[3], 'Bendy wire for repairs and crafts.');
MAT('mat_beads', 'Glass beads', 90, 'berry', Rr.sky[3], 'A tub of sparkly beads.', { tags: ['cute'] });
MAT('mat_clay', 'Clay', 80, 'rock', Rr.coral[1], 'Soft modelling clay.');
MAT('mat_brass_gear', 'Brass gear', 250, 'gear', Rr.butter[1], 'A shiny brass cog. Tobias says a gear is a promise kept.', { c2: Rr.butter[0], tags: ['clock'] });
MAT('mat_clock_parts', 'Clock parts', 180, 'gear', Rr.metal[2], 'Springs, screws and tiny wheels in a tin.', { c2: Rr.metal[1], tags: ['clock'] });
MAT('mat_spring', 'Mainspring', 120, 'feather', Rr.metal[3], 'A tightly coiled spring for clocks and music boxes.', { tags: ['clock'] });
MAT('mat_glass', 'Glass pane', 100, 'paper', Rr.sky[4], 'A small pane of clear glass.');
MAT('mat_felt', 'Felt sheets', 60, 'paper', Rr.coral[3], 'Soft felt in bright colours.', { tags: ['cute'] });
MAT('mat_bait_worms', 'Bait worms', 30, 'jar', Rr.dirt[3], 'Wriggly bait. Good for most fish.', { c3: Rr.coral[2], tags: ['bait'] });
MAT('mat_bait_shrimp', 'Bait shrimp', 60, 'shell', Rr.coral[3], 'Tiny shrimp that sea fish can\'t resist.', { tags: ['bait'] });
MAT('mat_bait_premium', 'Premium bait', 150, 'jar', Rr.lilac[2], 'Captain Jun\'s secret mix. Rare fish bite more often.', { c3: Rr.butter[2], tags: ['bait', 'rare'] });
MAT('mat_lure_spoon', 'Spoon lure', 200, 'feather', Rr.metal[3], 'A flashy metal lure. Reusable.', { tags: ['lure'] });
MAT('mat_fertiliser', 'Fertiliser', 60, 'sack', Rr.dirt[2], 'Plant food. Crops grow happier.', { c3: Rr.forest[3], tags: ['garden'] });
MAT('mat_premium_fertiliser', 'Premium fertiliser', 220, 'sack', Rr.forest[1], 'Goro swears by it. So do his giant pumpkins.', { c3: Rr.butter[2], tags: ['garden', 'rare'] });
MAT('mat_stamp', 'Postage stamp', 20, 'stamp', Rr.coral[2], 'For sending letters and parcels.', { tags: ['post'] });
MAT('mat_letter_set', 'Letter set', 120, 'letter', Rr.hairPink[2], 'Pretty paper and envelopes for handwritten letters.', { tags: ['post', 'cute'] });

// ---------------------------------------------------------------- gifts (sold in shops; good presents)
const GIFT = (id, name, buy, shape, c, desc, extra = {}) => add(id, name, 'gift', buy, shape, c, { desc, ...extra });
GIFT('gift_lucky_cat', 'Lucky cat figurine', 900, 'toy', '#fffaf0', 'A beckoning cat for good fortune. Sachiko has a shelf of them.', { c2: Rr.coral[2], tags: ['cute', 'decor'] });
GIFT('gift_bouquet', 'Flower bouquet', 500, 'flower', Rr.hairPink[2], 'A wrapped bunch of seasonal flowers.', { tags: ['flower', 'universalLove'] });
GIFT('gift_gold_stationery', 'Gold star stationery', 450, 'paper', Rr.butter[2], 'Notepaper with gold foil stars. Very serious, very sparkly.', { tags: ['stationery'] });
GIFT('gift_cute_stationery', 'Cute stationery set', 300, 'paper', Rr.hairPink[2], 'Pens, stickers and a notebook with a cat on it.', { tags: ['stationery', 'cute'] });
GIFT('gift_violin_rosin', 'Violin rosin', 600, 'gem', Rr.butter[1], 'A cake of amber rosin for a violin bow.', { tags: ['music'] });
GIFT('gift_vinyl_record', 'Vinyl record', 1200, 'coin', Rr.charcoal[2], 'A second-hand jazz record with a dreamy cover.', { tags: ['music', 'rare'] });
GIFT('gift_retro_cartridge', 'Retro game cartridge', 1500, 'ticket', Rr.charcoal[3], 'A boxed classic from 1991. Kiko would lose her composure.', { tags: ['game', 'rare'] });
GIFT('gift_soccer_card', 'Rare soccer card', 800, 'ticket', Rr.forest[2], 'A shiny card of a famous striker.', { tags: ['sporty', 'rare'] });
GIFT('gift_sports_towel', 'Sports towel', 400, 'box', Rr.navy[2], 'A big fluffy towel with stripes.', { c2: '#fffaf0', tags: ['sporty'] });
GIFT('gift_bike_bell', 'Bike bell', 350, 'coin', Rr.ribbon[2], 'A bright red ring-ring bell.', { tags: ['sporty'] });
GIFT('gift_rare_stamp', 'Rare stamp', 700, 'stamp', Rr.lilac[2], 'A stamp from the 1985 Starlight Festival issue.', { tags: ['post', 'rare'] });
GIFT('gift_postcard', 'Postcard', 80, 'letter', Rr.sky[2], 'A postcard of the Hoshimori lighthouse.', { tags: ['post'] });
GIFT('gift_watch_chain', 'Silver watch chain', 1400, 'key', Rr.metal[3], 'A fine silver chain for a pocket watch.', { tags: ['clock', 'fancy'] });
GIFT('gift_star_chart', 'Star chart', 650, 'paper', Rr.navy[1], 'A rolled map of the spring sky.', { tags: ['stars'] });
GIFT('gift_hot_sauce', 'Hot sauce', 300, 'bottle', Rr.ribbon[2], 'Dangerously red. Dad would approve.', { c2: Rr.forest[2], tags: ['spicy'] });
GIFT('gift_coffee_gift', 'Coffee gift box', 700, 'box', Rr.woodDark[2], 'Three single-origin bags tied with string.', { c2: Rr.butter[2], tags: ['coffee'] });
GIFT('gift_tea_tin', 'Tea gift tin', 600, 'jar', Rr.forest[3], 'Premium tea leaves in a painted tin.', { c3: Rr.butter[2], tags: ['tea'] });
GIFT('gift_candle', 'Scented candle', 450, 'jar', Rr.lilac[3], 'Smells like lavender and rain.', { c3: Rr.butter[3], tags: ['cozy'] });
GIFT('gift_hair_clip', 'Star hair clip', 380, 'star', Rr.hairPink[2], 'A sparkly star-shaped clip.', { tags: ['cute', 'fashion'] });
GIFT('gift_plush_cat', 'Cat plushie', 650, 'toy', Rr.hairGinger[3], 'A squishy orange cat. It looks a bit like Mochi.', { c2: Rr.hairPink[2], tags: ['cute', 'toy'] });
GIFT('gift_sketchbook', 'Sketchbook', 300, 'book', Rr.paper[2], 'Thick paper that loves pencils.', { tags: ['art'] });
GIFT('gift_lucky_lure', 'Lucky lure', 900, 'feather', Rr.butter[2], 'A golden lure that sailors say brings good weather.', { tags: ['fishing', 'rare'] });
GIFT('gift_photo_frame', 'Photo frame', 400, 'frame', Rr.wood[2], 'A little wooden frame for a favourite photo.', { tags: ['decor'] });
GIFT('gift_music_box', 'Music box', 1600, 'box', Rr.wood[1], 'A tiny wooden box that plays a lullaby.', { c2: Rr.butter[2], tags: ['music', 'rare'] });
GIFT('gift_compass', 'Antique compass', 1100, 'coin', Rr.butter[1], 'Brass, heavy and always pointing home.', { tags: ['rare', 'fancy'] });
GIFT('gift_perfume', 'Perfume', 900, 'bottle', Rr.hairPink[3], 'A tiny bottle that smells of peaches.', { c2: Rr.lilac[2], tags: ['fashion'] });
GIFT('gift_horoscope_mag', 'Horoscope magazine', 250, 'book', Rr.lilac[2], 'This week: good luck for anyone born in summer!', { tags: ['magazine'] });
GIFT('gift_umbrella_charm', 'Teru teru bozu', 150, 'toy', '#fffaf0', 'A little cloth doll that wishes for sunny days.', { c2: Rr.sky[2], tags: ['cute'] });
GIFT('gift_jam', 'Strawberry jam', 380, 'jar', Rr.ribbon[2], 'Homestyle jam from the farmers\' market.', { c3: '#fffaf0', tags: ['sweet'] });
GIFT('gift_pressed_flower', 'Pressed flower bookmark', 280, 'paper', Rr.sakura[2], 'A real violet pressed under glassine.', { tags: ['flower', 'book'] });
GIFT('gift_wind_chime', 'Glass wind chime', 550, 'bottle', Rr.sky[3], 'Ting, ting. Sounds like summer.', { c2: Rr.ribbon[2], tags: ['decor', 'summer'], seasons: ['summer'] });

// ---------------------------------------------------------------- books (skill books give XP once when read)
const BOOK = (id, name, buy, c, desc, skillBook, extra = {}) => add(id, name, 'book', buy, 'book', c, {
  desc, tags: ['book', ...(extra.tags || [])], skillBook,
  ...(skillBook ? { useLabel: 'Read', use: (g) => readBook(g, id) } : {}),
});
export function readBook(game, id) {
  const it = R_ITEM(id), sb = it.skillBook, key = 'econ_read_' + id;
  if (game.flag(key)) { game.toast(`You already know ${it.name} by heart.`, it.icon); return true; }
  game.setFlag(key, game.day); game.advance(30); game.addXP(sb.skill, sb.xp); game.addMood(3); game.sfx('page');
  game.toast(`Read ${it.name}: +${sb.xp} ${sb.skill} XP`, it.icon); game.stat('booksRead');
  return true;
}
import { get } from '../../core/registry.js';
const R_ITEM = (id) => get('item', id);
BOOK('book_cookbook', 'Home cooking basics', 600, Rr.coral[2], 'Dad\'s favourite cookbook, full of sticky notes.', { skill: 'cooking', xp: 60 });
BOOK('book_garden_guide', 'Seasonal garden guide', 600, Rr.forest[2], 'When to sow, when to water, when to wait.', { skill: 'gardening', xp: 60 });
BOOK('book_fish_atlas', 'Bay fish atlas', 600, Rr.water[3], 'Every fish in Hoshimori Bay, with hand-drawn plates.', { skill: 'fishing', xp: 60 });
BOOK('book_craft_manual', 'Little crafts manual', 600, Rr.wood[3], 'Knots, joints, folds and stitches.', { skill: 'crafting', xp: 60 });
BOOK('book_study_guide', 'Exam study guide', 500, Rr.sky[1], 'Tips, tricks and too many practice questions.', { skill: 'study', xp: 60 });
BOOK('book_etiquette', 'Kind words handbook', 500, Rr.hairPink[2], 'How to listen, how to thank, how to make friends.', { skill: 'charm', xp: 60 });
BOOK('book_home_tips', 'Clever home tips', 500, Rr.butter[2], 'Lemon for limescale, newspaper for windows.', { skill: 'homemaking', xp: 60 });
BOOK('book_mystery', 'Mystery novel', 450, Rr.navy[1], 'A detective, a locked lighthouse, a missing cat. Suzu loves these.', null, { tags: ['mystery'] });
BOOK('book_manga', 'Shoujo manga', 300, Rr.hairPink[3], 'Volume 7. The confession is finally happening!', null, { tags: ['manga'] });
BOOK('book_maths_workbook', 'Maths workbook', 350, Rr.metal[2], 'One hundred pages of equations. Kai is scared of it.', { skill: 'study', xp: 30 }, { tags: ['school'] });
BOOK('book_star_atlas', 'Star atlas', 800, Rr.navy[0], 'Constellations, myths and a fold-out sky map.', { skill: 'study', xp: 40 }, { tags: ['stars'] });
BOOK('book_picture_book', 'Picture book', 350, Rr.butter[3], 'A whale who wanted to see the moon.', null, { tags: ['cute'] });
BOOK('book_poetry', 'Haiku collection', 400, Rr.sakura[2], 'Short poems for long evenings.', { skill: 'charm', xp: 25 });

// ---------------------------------------------------------------- tools (hobbies read tool_rod, tool_net, tool_can, tool_hoe and `tier`)
const TOOL = (id, name, buy, shape, c, desc, tier = 1, extra = {}) => add(id, name, 'tool', buy, shape, c, { desc, tier, tags: ['tool', ...(extra.tags || [])], ...extra, ...(extra.tags ? { tags: ['tool', ...extra.tags] } : {}) });
TOOL('tool_rod', 'Bamboo rod', 500, 'feather', Rr.wood[3], 'A simple bamboo fishing rod. Every angler starts here.', 1, { tags: ['fishing'] });
TOOL('tool_rod_2', 'Fibreglass rod', 2000, 'feather', Rr.sky[2], 'Lighter and stronger. Bigger fish, fewer escapes.', 2, { tags: ['fishing'] });
TOOL('tool_rod_3', 'Carbon pro rod', 6000, 'feather', Rr.charcoal[3], 'Captain Jun\'s pick for deep-sea legends.', 3, { tags: ['fishing'] });
TOOL('tool_net', 'Bug net', 400, 'tool', Rr.forest[3], 'A wide net for butterflies and beetles.', 1, { tags: ['bugs'] });
TOOL('tool_net_2', 'Silk bug net', 1800, 'tool', Rr.lilac[3], 'A fine silk net that rare bugs don\'t notice.', 2, { tags: ['bugs'] });
TOOL('tool_can', 'Watering can', 400, 'pot', Rr.sky[2], 'A tin watering can. Waters one plot at a time.', 1, { tags: ['garden'] });
TOOL('tool_can_2', 'Copper watering can', 1800, 'pot', Rr.hairGinger[2], 'Holds more water and sprinkles three plots.', 2, { tags: ['garden'] });
TOOL('tool_hoe', 'Hoe', 400, 'tool', Rr.metal[2], 'For tilling soil plots.', 1, { tags: ['garden'] });
TOOL('tool_hoe_2', 'Steel hoe', 1800, 'tool', Rr.metal[3], 'Tills faster with less effort.', 2, { tags: ['garden'] });
TOOL('tool_trowel', 'Trowel', 300, 'tool', Rr.coral[2], 'For digging up treasures and transplanting.', 1, { tags: ['garden'] });
TOOL('tool_flashlight', 'Flashlight', 600, 'can', Rr.butter[2], 'Lights the way on night walks.', 1, { tags: ['night'] });
TOOL('tool_umbrella', 'Umbrella', 450, 'tool', Rr.sky[2], 'Keeps Misa dry. Captain Jun refuses to own one.', 1, { tags: ['rain'] });
TOOL('tool_tackle_box', 'Tackle box', 1500, 'box', Rr.ribbon[2], 'Keeps hooks and lures tidy. Captain Jun\'s seal of approval.', 1, { c2: Rr.metal[3], tags: ['fishing'] });

// ---------------------------------------------------------------- pet treats and toys (Dr. Mori's clinic)
const PET = (id, name, buy, shape, c, desc, extra = {}) => add(id, name, 'gift', buy, shape, c, { desc, ...extra, tags: ['pet', ...(extra.tags || [])] });
PET('toy_feather_wand', 'Feather wand', 300, 'feather', Rr.hairPink[2], 'Mochi\'s favourite toy in the whole world.', { tags: ['cat', 'toy'] });
PET('toy_catnip_mouse', 'Catnip mouse', 200, 'toy', Rr.metal[2], 'A grey felt mouse stuffed with catnip.', { tags: ['cat', 'toy'] });
PET('toy_yarn_ball', 'Yarn ball toy', 150, 'berry', Rr.coral[2], 'For batting under the sofa.', { tags: ['cat', 'toy'] });
PET('toy_tennis_ball', 'Tennis ball', 150, 'fruit', Rr.butter[3], 'Daifuku would chase this to the moon.', { tags: ['dog', 'toy'] });
PET('snack_pet_salmon', 'Salmon flakes', 180, 'jar', Rr.coral[3], 'Cat treats made from real salmon.', { c3: Rr.coral[1], tags: ['cat', 'treat'] });
PET('snack_pet_tuna', 'Tuna flakes', 160, 'can', Rr.sky[2], 'A little can of tuna for cats.', { c3: Rr.coral[3], tags: ['cat', 'treat'] });
PET('snack_pet_kitten', 'Kitten formula', 220, 'carton', '#fffaf0', 'Gentle milk for very small cats.', { c2: Rr.sky[2], tags: ['cat', 'treat'] });
PET('snack_pet_bone', 'Dog bone treat', 160, 'bread', Rr.paper[3], 'A crunchy bone-shaped biscuit.', { tags: ['dog', 'treat'] });
PET('snack_pet_jerky', 'Jerky strips', 200, 'feather', Rr.wood[1], 'Chewy treats for good dogs.', { tags: ['dog', 'treat'] });

// ---------------------------------------------------------------- Star Stickers (the second "currency", an item)
register('item', 'star_sticker', {
  name: 'Star Sticker', cat: 'misc', price: 0, icon: itemIcon('sticker', { c: Rr.butter[2], c2: Rr.butter[1], c3: Rr.butter[3] }),
  desc: 'A shiny gold star. Earned from home tasks, requests and kindness. Spend them in Aunt Nori\'s Star Catalogue.',
  tags: ['currency'], noSell: true,
});
ECON_ITEMS.push('star_sticker');

features('Inventory & items', [
  'Over 200 shop goods: groceries, 50 cooking ingredients, snacks, drinks, meals, materials, gifts, books, tools and pet treats, each with its own icon',
  'Food and drinks restore different amounts of energy; meals fill you up more than snacks',
  'Skill books give a chunk of skill XP the first time you read them from the bag',
]);
features('Money, shops & economy', [
  'Star Stickers: a stackable gold sticker item earned from home tasks and requests, spent in the Star Catalogue',
]);
