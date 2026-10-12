// Economy area: every shop in town (schema in src/ui/shop.js), their interactions (ids from docs/WORLD.md),
// the vending machines, Sunny Mart's gacha capsule machine and the home shipping box.
//
// Interaction ids registered here: shop_mart shop_cafe shop_bait shop_fishmarket shop_salon shop_clinic shop_woodworks
// shop_stall shop_market shop_ramen shop_noodles shop_shavedice shop_post vending, plus (new, for map owners)
// mart_gacha (Sunny Mart, spot 'gacha') and ship_box (home yard by the door; sprite 'econ_ship_box' 32x26).
import { register, registerMany, get, all, features } from '../../core/registry.js';
import { defineSprite } from '../../art.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS } from '../../gfx/palette.js';
import { shopOpen, hoursText, addBuff, pay, charge, weekOf } from './core.js';
import '../../ui/shop.js';

const Rr = RAMPS;
const SEASON_OK = (it, season) => !it.seasons && !it.season ? true : (it.seasons || [it.season]).includes(season);

// ---------------------------------------------------------------- keepers who are not cast NPCs
const KEEP = {
  sachiko: { name: 'Sachiko', look: { hair: '#b8a0c8', top: '#f0c040', bottom: '#4f8a58', skin: '#f8d5b8', accent: '#e87aa0' } },
  mika: { name: 'Mika', look: { hair: '#f4f0f0', top: '#a890c8', bottom: '#fff1d6', skin: '#f8d5b8', accent: '#ffd76a' } },
  jun: { name: 'Captain Jun', look: { hair: '#e8e8f0', top: '#e8c838', bottom: '#2a3a5a', skin: '#d6a07c', accent: '#2a3a5a' } },
  pip: { name: 'Pip', look: { hair: '#4a3436', top: '#5a8cc0', bottom: '#2a3552', skin: '#f8d5b8', accent: '#e0503a' } },
  tama: { name: 'Auntie Tama', look: { hair: '#38334f', top: '#3f8fb8', bottom: '#4a4a5a', skin: '#d6a07c', accent: '#ffd76a' } },
  rei: { name: 'Rei', look: { hair: '#ff85b8', top: '#262436', bottom: '#262436', skin: '#f8d5b8', accent: '#86cdb0' } },
  drmori: { name: 'Dr. Mori', look: { hair: '#5a5478', top: '#fffaf0', bottom: '#5f80b4', skin: '#f2c9a4', accent: '#86cdb0' } },
  kinoko: { name: 'Mr. Kinoko', look: { hair: '#6a4436', top: '#4f8a58', bottom: '#7a4f3a', skin: '#d6a07c', accent: '#c45a46' } },
  basho: { name: 'Basho', look: { hair: '#c8c8dc', top: '#5b3fa8', bottom: '#3a3850', skin: '#c68a62', accent: '#ffd76a' } },
  hiro: { name: 'Hiro', look: { hair: '#24203a', top: '#fffaf0', bottom: '#2a3552', skin: '#f2c9a4', accent: '#d93b3b' } },
  sen: { name: 'Old Sen', look: { hair: '#f2f2fa', top: '#3d5a8c', bottom: '#3a3850', skin: '#d6a07c', accent: '#e0a84a' } },
  natsu: { name: 'Natsu', look: { hair: '#d9763f', top: '#7fb2e0', bottom: '#fffaf0', skin: '#f2c9a4', accent: '#e0707a' } },
};
const keeper = (id) => ({ owner: id, keeper: KEEP[id] });

// ---------------------------------------------------------------- gacha figurines (Sunny Mart capsule machine)
const FIGS = [
  ['lucky_cat', 'Lucky cat', '#fffaf0'], ['shiba', 'Shiba pup', Rr.sand[2]], ['tanuki', 'Tanuki', Rr.wood[2]], ['daruma', 'Daruma', Rr.ribbon[2]],
  ['onigiri', 'Onigiri pal', '#fffaf0'], ['star_whale', 'Star whale', Rr.navy[2]], ['frog', 'Rain frog', Rr.forest[3]], ['bunny', 'Moon bunny', Rr.paper[4]],
  ['octopus', 'Octopus', Rr.coral[2]], ['penguin', 'Penguin', Rr.charcoal[2]], ['fox', 'Shrine fox', Rr.hairGinger[2]], ['owl', 'Night owl', Rr.wood[1]],
  ['crab', 'Beach crab', Rr.ribbon[2]], ['panda', 'Panda', '#fffaf0'], ['hamster', 'Hamster', Rr.butter[3]], ['koi', 'Koi', Rr.hairGinger[3]],
  ['robot', 'Tin robot', Rr.metal[3]], ['ghost', 'Little ghost', Rr.lilac[4]], ['dino', 'Dino', Rr.mint[2]], ['bear', 'Honey bear', Rr.wood[3]],
  ['seal', 'Seal', Rr.metal[2]], ['dragon', 'Tiny dragon', Rr.forest[2]], ['cloud', 'Cloud', Rr.sky[3]], ['gold_mochi', 'Golden Mochi', Rr.butter[2]],
];
export const FIG_IDS = FIGS.map(([id, name, c], i) => {
  register('item', 'toy_fig_' + id, { name: `${name} figure`, cat: 'decor', price: i === 23 ? 300 : 60, icon: itemIcon('toy', { c, c2: Rr.coral[2] }), desc: `Capsule figurine ${i + 1} of 24. ${i === 23 ? 'The rare one! It looks just like Mochi.' : 'Tiny, cute and very collectible.'}`, tags: ['figurine', 'cute', 'decor'] });
  return 'toy_fig_' + id;
});
function spinGacha(game) {
  if (!charge(game, 200, 'Gacha capsule')) return;
  const r = game.rng(), id = r < 0.02 ? FIG_IDS[23] : FIG_IDS[Math.floor(game.rng() * 23)];
  const it = get('item', id), first = game.collect('figurine', id);
  game.give(id, 1, true); game.sfx(first ? 'star' : 'pop'); game.state.economy.gacha++;
  const have = FIG_IDS.filter((f) => game.collected('figurine', f)).length;
  game.run([{ t: 'say', who: null, text: `*clunk* A capsule rolls out... it's the ${it.name}!${first ? ' A new one!' : ' Another one of these.'} (${have}/24 collected)` }]);
  if (have === 24 && !game.flag('econ_gacha_full')) { game.setFlag('econ_gacha_full'); game.giveStickers(3, 'full figurine set'); }
}

// ---------------------------------------------------------------- shops
const seedStock = (g) => all('item').filter((it) => it.cat === 'seed' && SEASON_OK(it, g.season)).map((it) => it.id);
const fishStock = () => all('item').filter((it) => it.cat === 'fish' && it.price).sort((a, b) => a.price - b.price).slice(0, 8).map((it) => ({ item: it.id, price: Math.round(it.price * 2.2 / 5) * 5 }));

const SHOPS = {
  mart: {
    name: 'Sunny Mart', ...keeper('sachiko'), hours: ['7:00', '21:00'], color: Rr.butter[1], buys: ['crop'], buyTags: ['ingredient'], bonusCats: ['crop'],
    greet: { default: ['Welcome to Sunny Mart, dear! Fresh everything today.', 'Oh, Misa! Let me know if you need help finding anything.', 'Coupons, coupons... oh! Hello, sweetheart.'], morning: ['Early bird! The bread just came in.'], evening: ['Evening, dear. Bento are still nice and fresh.'], rain: ['Soaked? We have umbrellas by the door!'], sale: ['This week {sale} are twenty percent off. Don\'t tell anyone. Well, tell everyone.'], h4: ['My favourite customer! Did you eat today? You look thin.'], thanks: ['Thank you, dear!', 'Come again soon!', 'Good choice. My son loved those.'], sold: ['Lovely produce! I\'ll put it right out front.'] },
    stock: [
      'ing_rice', 'ing_egg', 'ing_flour', 'ing_sugar', 'ing_milk', 'ing_butter', 'ing_tea', 'ing_coffee', 'ing_matcha', 'ing_tofu', 'ing_miso', 'ing_soy', 'ing_salt', 'ing_oil',
      'ing_noodles', 'ing_nori', 'ing_red_bean', 'ing_mochiko', 'ing_honey', 'ing_chocolate', 'ing_cheese', 'ing_bread', 'ing_curry', 'ing_onion', 'ing_carrot', 'ing_potato',
      'ing_cabbage', 'ing_tomato', 'ing_fish_flakes', 'ing_cream', 'ing_vanilla', 'ing_ginger', 'ing_sesame', 'ing_dashi', 'ing_mirin', 'ing_vinegar', 'ing_kelp', 'ing_chicken',
      'ing_yogurt', 'ing_umeboshi', 'ing_cinnamon', 'ing_mint',
      { item: 'ing_strawberry', when: 'season:spring' }, { item: 'ing_lemon', when: 'season:summer' }, { item: 'ing_peach', when: 'season:summer' }, { item: 'ing_corn', when: 'season:summer' },
      { item: 'ing_cucumber', when: 'season:summer' }, { item: 'ing_apple', when: 'season:autumn|winter' }, { item: 'ing_mushroom', when: 'season:autumn' }, { item: 'ing_pumpkin', when: 'season:autumn|winter' },
      { item: 'ing_spinach', when: 'season:winter|spring' },
      'snack_rice_crackers', 'snack_melon_bread', 'snack_curry_bread', 'snack_onigiri_salmon', 'snack_onigiri_ume', 'snack_potato_chips', 'snack_pudding', 'snack_choco_bar', 'snack_candy',
      'snack_cookies', 'snack_sandwich', 'snack_banana', { item: 'snack_limited_pudding', when: 'day:fri|sat', limit: 2 }, { item: 'snack_sakura_mochi', when: 'season:spring' },
      'food_karaage_bento', 'food_salmon_bento', 'food_veggie_bento', { item: 'food_oden', when: 'season:autumn|winter' },
      'bev_water', 'bev_green_tea', 'bev_barley_tea', 'bev_sports_drink', 'bev_ramune', 'bev_milk_tea', 'bev_energy_drink',
      'tool_can', 'tool_hoe', 'tool_trowel', 'tool_net', 'tool_umbrella', 'tool_flashlight', 'mat_fertiliser',
      'mat_paper', 'mat_washi', 'mat_glue', 'mat_string', 'mat_felt', 'gift_cute_stationery', 'gift_gold_stationery', 'gift_umbrella_charm', 'gift_lucky_cat', 'gift_candle',
      'book_manga', 'book_horoscope_mag', 'book_maths_workbook', 'book_home_tips', 'book_cookbook',
      { item: 'gift_wind_chime', when: 'season:summer' },
    ].map((e) => (e === 'book_horoscope_mag' ? 'gift_horoscope_mag' : e)),
    stockFn: seedStock,
    services: [
      { id: 'bag36', name: 'Bigger bag (36 slots)', desc: 'A roomy backpack with 36 slots. Sachiko throws in a keychain.', price: 2000, icon: itemIcon('box', { c: Rr.coral[2] }), when: (g) => g.state.bagSize < 36, run: (g) => { g.state.bagSize = 36; g.toast('Bag upgraded to 36 slots!'); return 'There! Room for all your treasures.'; } },
      { id: 'bag48', name: 'Explorer bag (48 slots)', desc: 'The biggest bag in Hoshimori: 48 slots and lots of pockets.', price: 5000, icon: itemIcon('box', { c: Rr.navy[2] }), when: (g) => g.state.bagSize >= 36 && g.state.bagSize < 48, run: (g) => { g.state.bagSize = 48; g.toast('Bag upgraded to 48 slots!'); return 'My, you could carry the whole shop in that.'; } },
    ],
  },
  cafe: {
    name: 'Cafe Kumo', ...keeper('mika'), hours: ['8:00', '20:00'], closed: [2], color: Rr.lilac[1], buys: [], buyTags: ['fruit'],
    greet: { default: ['Welcome to Cafe Kumo! Kumo-chan is warmed up and ready.', 'Misa! Sit anywhere you like. Well, anywhere at the counter.', 'Hello hello! Today\'s cake is extra fluffy, I think.'], morning: ['Good morning! First latte of the day is the best one.'], rain: ['Rainy days are cocoa days, don\'t you think?'], h4: ['My favourite helper! Your usual?'], thanks: ['Enjoy! Kumo-chan put love in it.', 'Thank you! Here\'s a stamp for your card.', 'Careful, it\'s hot!'], sold: ['Fresh fruit! This is going in tomorrow\'s tart.'] },
    stock: ['bev_latte', 'bev_matcha_latte', 'bev_black_coffee', 'bev_earl_grey', 'bev_jasmine_tea', 'bev_cocoa', 'bev_strawberry_milk', 'bev_lemonade',
      'snack_strawberry_shortcake', 'snack_cheesecake', 'snack_choco_cake', 'snack_matcha_roll', { item: 'snack_pancakes', when: 'weekend' }, 'snack_honey_toast', 'snack_macarons'],
    onBuy(g, id, n, scene) {
      const ec = g.state.economy;
      if (ec.visits.cafeStamp === g.day) return;
      ec.visits.cafeStamp = g.day; ec.loyalty++;
      if (ec.loyalty >= 10) { ec.loyalty = 0; g.give('snack_strawberry_shortcake', 1); scene.say('Your card is full! A strawberry shortcake, on the house!', 'happy'); g.sfx('star'); }
    },
  },
  bait: {
    name: 'Bait and Tackle', ...keeper('jun'), hours: ['9:00', '17:00'], closedWeather: ['storm'], color: Rr.navy[1], buys: ['fish'], bonusCats: ['fish'],
    greet: { default: ['Ahoy, little sailor! Fish are biting, I can smell it.', 'Welcome aboard. Mind the bait bucket.', 'Did I ever tell you about the fish that sang? Another time. What d\'you need?'], morning: ['Early tide\'s the best tide!'], rain: ['Rain? Fish don\'t mind getting wet. Neither should you!'], thanks: ['Tight lines!', 'May the sea be kind to you.', 'Bring me a big one!'], sold: ['Now that\'s a fine catch!'] },
    stock: ['tool_rod', { item: 'tool_rod_2', when: 'skill:fishing>=2' }, { item: 'tool_rod_3', when: 'skill:fishing>=5' }, 'tool_tackle_box', 'mat_bait_worms', 'mat_bait_shrimp', { item: 'mat_bait_premium', when: 'skill:fishing>=3' },
      'mat_lure_spoon', 'gift_lucky_lure', 'book_fish_atlas', 'bev_can_coffee', 'snack_onigiri_salmon'],
  },
  fishmarket: {
    name: 'Fish Market', ...keeper('tama'), hours: ['6:00', '14:00'], closed: [6], color: Rr.water[2], buys: ['fish'], bonusCats: ['fish'],
    greet: { default: ['Fresh from the boats! Look at these beauties.', 'Morning, Misa! Selling or buying today?', 'The gulls have been eyeing my crates all morning.'], morning: ['You\'re up early! The best fish go first.'], thanks: ['Cook it tonight, it won\'t get fresher!', 'Thanks, love!'], sold: ['Ooh, a good one. My regulars will fight over it.'] },
    stock: ['ing_shrimp', 'ing_kelp', 'ing_fish_flakes', 'ing_nori', 'ing_salt', 'mat_bait_shrimp'], stockFn: fishStock,
  },
  salon: {
    name: 'Salon Snip', ...keeper('rei'), hours: ['10:00', '19:00'], closed: [0], color: Rr.hairPink[1], buyOnly: true,
    greet: { default: ['Welcome to Salon Snip! Ooh, your hair has so much potential.', 'Hi hi! Sit, relax. Let Rei work her magic.', 'Bob? Braid? Bunny ears? Just kidding. Unless...?'], thanks: ['Gorgeous! Go show everyone.', 'You\'re glowing, honestly.'] },
    stock: ['gift_hair_clip', 'gift_perfume'],
    services: [
      { id: 'blowdry', name: 'Blow-dry and style', desc: 'A quick wash and fluffy blow-dry. Pampered for 6 hours: +1 cozy every 10 minutes.', price: 500, icon: itemIcon('feather', { c: Rr.hairPink[2] }), run: (g) => { addBuff(g, 'pampered', 360); g.addMood(10); g.advance(30); return 'So fluffy! You look like a cloud. A cute cloud.'; } },
      { id: 'headspa', name: 'Head spa', desc: 'A dreamy scalp massage. +20 energy, +20 cozy and Pampered for the rest of the day.', price: 1200, icon: itemIcon('cup', { c: Rr.lilac[2] }), run: (g) => { if (g.flag('econ_spa') === g.day) return false; g.setFlag('econ_spa', g.day); g.addEnergy(20); g.addMood(20); addBuff(g, 'pampered', 600); g.advance(45); return 'Did you fall asleep? You totally fell asleep.'; } },
    ],
    stockFn(g) {
      const styles = g.salonStyles ? (Array.isArray(g.salonStyles) ? g.salonStyles : Object.values(g.salonStyles)) : [];
      this.services = this.services.filter((s) => !s.style);
      for (const s of styles) this.services.push({ style: true, id: 'style_' + (s.id || s.name), name: s.name || s.id, desc: s.desc || 'A brand-new hairstyle.', price: s.price || 1500, icon: s.icon || itemIcon('hat', { c: Rr.hairPink[2] }), run: (gg) => { if (typeof s.apply === 'function') s.apply(gg); else gg.state.hairstyle = s.id; gg.addMood(8); return 'Ta-da! A whole new you.'; } });
      return [];
    },
  },
  clinic: {
    name: 'Dr. Mori\'s Clinic', ...keeper('drmori'), hours: ['9:00', '18:00'], closed: [6], color: Rr.mint[1], buys: [],
    greet: { default: ['Hello, Misa. Anyone feeling poorly today? Two legs or four?', 'Welcome. Wash your hands, please. Paws too.', 'Ah, the Aoki girl. How is that orange cat of yours?'], thanks: ['Take care of yourselves.', 'Doctor\'s orders: get some rest.'] },
    stock: ['snack_pet_salmon', 'snack_pet_tuna', 'snack_pet_kitten', 'snack_pet_bone', 'snack_pet_jerky', 'toy_feather_wand', 'toy_catnip_mouse', 'toy_yarn_ball', 'toy_tennis_ball', 'bev_vitamin_drink'],
    stockFn: (g) => all('item').filter((it) => (it.tags || []).includes('pet') && !it.id.startsWith('toy_fig')).map((it) => it.id),
    services: [
      { id: 'checkup_mochi', name: 'Mochi\'s checkup', desc: 'Dr. Mori checks Mochi\'s ears, teeth and tummy.', price: 500, icon: itemIcon('toy', { c: Rr.hairGinger[3] }), when: (g) => typeof g.mochiCheckup === 'function', run: (g) => { setTimeout(() => g.mochiCheckup(), 0); return 'Bring her in, let\'s have a look.'; } },
      { id: 'checkup_me', name: 'Health check', desc: 'A quick check-up and a vitamin sweet. +25 energy, once a day.', price: 300, icon: itemIcon('cup', { c: Rr.mint[2] }), run: (g) => { if (g.flag('econ_health') === g.day) return false; g.setFlag('econ_health', g.day); g.addEnergy(25); g.advance(30); return 'Healthy as a horse. A sleepy horse. Go to bed earlier!'; } },
    ],
  },
  woodworks: {
    name: 'Kinoko Woodworks', ...keeper('kinoko'), hours: ['9:00', '18:00'], closed: [6], color: Rr.wood[1], buys: ['material'],
    greet: { default: ['Welcome to Kinoko Woodworks. Everything here was planed by hand.', 'Mind the sawdust. Looking to make that house cozier?', 'Hm. Good wood, good home. Have a look around.'], thanks: ['Built to last a hundred years.', 'I\'ll have Pip help carry it.'] },
    stock: ['mat_wood', 'mat_glue', 'mat_clay', 'gift_photo_frame', 'book_craft_manual'],
    stockFn: (g) => all('item').filter((it) => (it.tags || []).includes('furniture')).map((it) => ({ item: it.id, price: it.buy })),
    services: [],
    homeServices(g) {
      const ups = g.homeUpgrades ? (Array.isArray(g.homeUpgrades) ? g.homeUpgrades : Object.values(g.homeUpgrades)) : [];
      return ups.filter((u) => !u.when || (typeof u.when === 'function' ? u.when(g) : g.check(u.when))).map((u) => ({ id: 'up_' + (u.id || u.name), name: u.name, desc: u.desc || 'A home upgrade.', price: u.price || 3000, icon: u.icon || itemIcon('furniture', { c: Rr.wood[2] }), run: (gg) => { if (typeof u.buy === 'function') return u.buy(gg); if (typeof u.run === 'function') return u.run(gg); gg.setFlag('upgrade_' + u.id); return 'I\'ll start work tomorrow morning.'; } }));
    },
  },
  stall: {
    name: 'Basho\'s Stall', ...keeper('basho'), hours: ['10:00', '19:00'], days: [4], color: Rr.lilac[0], buys: ['mineral', 'shell', 'gift'], bonusCats: ['mineral', 'shell'],
    greet: { default: ['Ah, a traveller\'s eye! Treasures from far away, only on Fridays.', 'Welcome, welcome. Everything here has a story. Some are even true.', 'Basho the wanderer, at your service. Rare things, fair-ish prices.'], thanks: ['May it bring you fortune.', 'A fine choice. I\'ll miss it.'], sold: ['Oh my. This will travel far.'] },
    stock: [],
    stockFn(g) {
      const pool = ['gift_vinyl_record', 'gift_retro_cartridge', 'gift_watch_chain', 'gift_star_chart', 'mat_rainbow_wool', 'gift_compass', 'gift_music_box', 'mat_ink', 'gift_rare_stamp', 'gift_soccer_card', 'gift_tea_tin', 'mat_premium_fertiliser', 'book_star_atlas', 'gift_violin_rosin', 'gift_coffee_gift'];
      const r = g.rngFor('econ_basho', weekOf(g.day) * 7 + 1), picks = [];
      while (picks.length < 5) { const id = pool[Math.floor(r() * pool.length)]; if (!picks.includes(id)) picks.push(id); }
      return picks.map((id) => ({ item: id, price: Math.round(get('item', id).buy * 1.3 / 10) * 10, limit: 1 }));
    },
  },
  market: {
    name: 'Farmers\' Market', ...keeper('sachiko'), hours: ['8:00', '13:00'], days: [5], color: Rr.forest[1], buys: ['crop'], bonusCats: ['crop'], buyTags: ['fruit', 'vegetable'],
    greet: { default: ['Saturday market! Everything grown right here in Hoshimori.', 'My nephew\'s minding the shop, so I\'m all yours.', 'Lovely morning for a market, isn\'t it?'], thanks: ['Grown with love!', 'Enjoy, dear!'], sold: ['Look at that! Your garden is doing wonderfully.'] },
    stock: ['gift_jam', 'ing_honey', 'ing_egg', 'gift_bouquet', 'mat_fertiliser', 'mat_premium_fertiliser', 'gift_pressed_flower'],
    stockFn(g) {
      const veg = all('item').filter((it) => (it.id.startsWith('ing_') && it.seasons && it.seasons.includes(g.season)));
      const crops = all('item').filter((it) => it.cat === 'crop' && SEASON_OK(it, g.season)).slice(0, 8);
      return [...seedStock(g), ...veg.map((it) => it.id), ...crops.map((it) => it.id)];
    },
  },
  ramen: {
    name: 'Ramen Cart', ...keeper('hiro'), hours: ['18:00', '25:00'], color: Rr.ribbon[1], buyOnly: true,
    greet: { default: ['Irasshai! Pull up a stool.', 'Cold night? Hot broth. That\'s the rule.', 'The cart\'s been in my family for forty years. The broth too, almost.'], night: ['Late one, huh? I won\'t tell your grandma.'], thanks: ['Slurp loudly, it\'s polite!', 'Enjoy!'] },
    stock: ['food_shoyu_ramen', 'food_miso_ramen', 'food_spicy_ramen', 'food_gyoza', 'bev_barley_tea', { item: 'food_oden', when: 'season:autumn|winter' }],
  },
  noodles: {
    name: 'Harbour Noodles', ...keeper('sen'), hours: ['11:00', '21:00'], closed: [3], color: Rr.navy[2], buyOnly: true,
    greet: { default: ['Udon, soba, a seat by the sea. What more do you need?', 'Ah, young lady. Hungry? Of course you are.', 'Jun eats here every night. Don\'t take his stool.'], thanks: ['Mind the steam.', 'Come back soon.'] },
    stock: ['food_kitsune_udon', 'food_tempura_udon', 'food_zaru_soba', 'food_yakisoba', 'bev_green_tea'],
  },
  shavedice: {
    name: 'Shaved Ice Stand', ...keeper('natsu'), hours: ['10:00', '18:00'], when: 'season:summer', color: Rr.sky[1], buyOnly: true,
    greet: { default: ['Beat the heat! Which syrup today?', 'Summer\'s best friend, right here!', 'Brain freeze guaranteed, or your money back. Kidding.'], thanks: ['Eat it fast before it melts!', 'Stay cool!'] },
    stock: ['snack_ice_strawberry', 'snack_ice_melon', 'snack_ice_blue', 'snack_ice_lemon', 'snack_ice_matcha', 'bev_ramune'],
  },
  post: {
    name: 'Post Office', ...keeper('pip'), hours: ['9:00', '17:00'], closed: [6], color: Rr.sky[1], buyOnly: true,
    greet: { default: ['Hoshimori Post! Rain or shine, Pip delivers. Usually to the right house.', 'Hiya Misa! Sending something special?', 'Stamps, postcards, parcels... I\'ve got it all. Somewhere.'], thanks: ['Signed, sealed, and soon delivered!', 'I\'ll take it on my afternoon round.'] },
    stock: ['mat_stamp', 'mat_letter_set', 'gift_postcard', { item: 'gift_rare_stamp', limit: 1 }],
    services: [
      { id: 'care_package', name: 'Care package to the ship', desc: 'Pip boxes up snacks and a note for Mum and Dad on the Kujira. Once a week.', price: 300, icon: itemIcon('box', { c: Rr.wood[2] }), run: (g) => {
        if (g.flag('econ_care_week') === weekOf(g.day) + 1) return false;
        g.setFlag('econ_care_week', weekOf(g.day) + 1);
        for (const p of ['mum', 'dad']) if (get('npc', p)) g.addFriend(p, 25);
        g.addMood(6); g.mail(`econ_care_${g.day}`, 'Mum', 'A parcel from Hoshimori! Dad ate all the rice crackers before I even saw them. Thank you, sweetheart. We miss you.');
        return 'Off it goes to the high seas!';
      } },
    ],
  },
  vending: {
    name: 'Vending Machine', machine: true, color: Rr.ribbon[2], buyOnly: true,
    greet: () => 'BZZT. Please select a drink. Thank you for your custom.',
    stock: ['bev_water', 'bev_green_tea', 'bev_sports_drink', 'bev_ramune', 'bev_melon_soda', 'bev_milk_tea', 'bev_can_coffee', { item: 'bev_corn_soup', when: 'season:autumn|winter' }, { item: 'bev_cocoa', when: 'season:winter' }],
    onBuy(g, id, n, scene) {
      for (let i = 0; i < n; i++) if (g.rng() < 0.02) { g.give(id, 1, true); scene.say('Ding ding ding! A bonus can! Lucky day!', 'happy'); g.sfx('star'); g.stat('vendingBonus'); return; }
      scene.say('*clunk* Thank you. Have a refreshing day.', 'neutral');
    },
  },
  shipbox: {
    name: 'Shipping Box', machine: false, owner: 'pip', keeper: KEEP.pip, mode: 'ship', buys: ['all'], color: Rr.wood[1],
    greet: () => 'Pip collects this box every morning and pays for everything inside. (Favourite items stay in your bag.)',
  },
};
for (const [id, def] of Object.entries(SHOPS)) register('shop', id, def);
// Woodworks: home upgrades from the interiors area appear as services at runtime.
const ww = get('shop', 'woodworks');
ww.stockFn = ((base) => (g) => { ww.services = ww.homeServices(g); return base(g); })(ww.stockFn);

// ---------------------------------------------------------------- interactions
function visitShop(game, id, label) {
  const shop = get('shop', id);
  if (!shopOpen(game, shop)) {
    const why = shop.when && !game.check(shop.when) ? 'Closed for the season.' : shop.closedWeather && shop.closedWeather.includes(game.weather) ? 'Closed today because of the weather.' : 'Closed right now.';
    return game.run([{ t: 'say', who: null, text: `${label}: ${why} Hours: ${hoursText(shop)}.` }]);
  }
  return new Promise((res) => game.open('shop', id, res));
}
const LABELS = {
  shop_mart: ['mart', 'Sunny Mart'], shop_cafe: ['cafe', 'Cafe Kumo counter'], shop_bait: ['bait', 'Bait and Tackle'], shop_fishmarket: ['fishmarket', 'Fish market'],
  shop_salon: ['salon', 'Salon Snip'], shop_clinic: ['clinic', 'Dr. Mori\'s Clinic'], shop_woodworks: ['woodworks', 'Kinoko Woodworks'], shop_stall: ['stall', 'Basho\'s stall'],
  shop_market: ['market', 'Farmers\' market'], shop_ramen: ['ramen', 'Ramen cart'], shop_noodles: ['noodles', 'Noodle stand'], shop_shavedice: ['shavedice', 'Shaved ice stand'], shop_post: ['post', 'Post office counter'],
};
for (const [iid, [sid, label]] of Object.entries(LABELS)) {
  register('interaction', iid, { label: (g) => (shopOpen(g, get('shop', sid)) ? label : `${label} (closed)`), run: (g) => visitShop(g, sid, label) });
}
registerMany('interaction', {
  vending: { label: 'Vending machine', run: (g) => g.run([{ t: 'choice', prompt: 'Vending machine', options: [
    { text: 'Buy a drink', steps: [{ t: 'shop', id: 'vending' }] },
    { text: 'Peek under the machine', steps: [{ t: 'call', fn: (gg) => {
      const ec = gg.state.economy;
      if (ec.vendingCoinDay === gg.day) return gg.run([{ t: 'say', who: 'misa', mood: 'neutral', text: 'Just dust bunnies now. Maybe tomorrow.' }]);
      ec.vendingCoinDay = gg.day;
      if (gg.rngFor('econ_luckycoin')() < 0.45) { const n = [10, 10, 50, 50, 100][Math.floor(gg.rng() * 5)]; pay(gg, n, 'Lucky coin under a vending machine'); gg.sfx('coin'); return gg.run([{ t: 'say', who: 'misa', mood: 'happy', text: `Ooh! A ${n} coin! Finders keepers.` }]); }
      return gg.run([{ t: 'say', who: 'misa', mood: 'sad', text: 'Nothing but a bottle cap. Worth a look though!' }]);
    } }] },
    { text: 'Leave', steps: [] },
  ] }]) },
  mart_gacha: { label: 'Capsule machine (200c)', run: (g) => g.run([{ t: 'choice', prompt: `Capsule toys: 24 to collect (${FIG_IDS.filter((f) => g.collected('figurine', f)).length}/24)`, options: [
    { text: 'Turn the handle (200 coins)', when: 'money>=200', steps: [{ t: 'call', fn: spinGacha }] }, { text: 'Not now', steps: [] }] }]) },
  ship_box: { label: 'Shipping box', run: (g) => new Promise((res) => g.open('shop', 'shipbox', res)) },
});

// Shipping box sprite for the yard (32x26 + outline), wooden crate with a lid and a hanging tag.
defineSprite('econ_ship_box', 32, 26, (R) => {
  const W = Rr.wood;
  R(1, 8, 30, 17, W[2]); R(1, 8, 30, 2, W[3]); R(1, 23, 30, 2, W[1]);
  for (const x of [1, 15, 29]) R(x, 8, 2, 17, W[1]);
  R(3, 14, 26, 1, W[1]); R(3, 19, 26, 1, W[1]);
  R(0, 3, 32, 5, W[3]); R(0, 3, 32, 1, W[4]); R(0, 7, 32, 1, W[1]);
  R(13, 1, 6, 3, Rr.metal[2]); R(14, 1, 4, 1, Rr.metal[3]);
  R(22, 10, 6, 7, Rr.paper[3]); R(23, 11, 4, 1, Rr.coral[2]); R(23, 13, 3, 1, Rr.paper[1]); R(24, 8, 1, 2, Rr.paper[1]);
}, { hd: true, outline: 'selective' });

features('Money, shops & economy', [
  'Shop screen with buy and sell tabs: icon, price, how many you own and a description for every item, plus +/- to buy or sell in bulk',
  'Every shopkeeper greets you with their portrait and a line that changes with the time of day, weather, the weekly sale and your friendship',
  'Shop hours and closed days: shops refuse politely when closed and tell you their opening hours',
  'Shopping somewhere once a day gives a little friendship with that shopkeeper',
  'Sunny Mart: groceries, 50 ingredients with seasonal fruit and vegetables, snacks, bento, drinks, basic tools, stationery, gifts and seasonal seeds',
  'Selling: crops to Sunny Mart and the Saturday market, fish to Jun and the fish market (10% bonus for their speciality), fruit to Cafe Kumo, rarities to Basho',
  'Bag upgrades at Sunny Mart: 36 slots for 2000 coins, then 48 slots for 5000',
  'Cafe Kumo menu (closed Wednesdays): lattes, teas and cakes that give buffs, with weekend souffle pancakes',
  'Cafe Kumo loyalty card: a stamp per visit, and 10 stamps earn a free strawberry shortcake',
  'Bait and Tackle: rods that unlock with Fishing skill, bait, lures, a tackle box and the fish atlas; closed in storms',
  'Harbour fish market (mornings): buys and sells fresh fish',
  'Salon Snip: blow-dry and head spa treatments that pamper Misa, plus new hairstyles when the salon has them',
  'Dr. Mori\'s clinic: pet treats and toys, Mochi\'s checkup, and a daily health check that restores energy',
  'Kinoko Woodworks stocks every piece of furniture in the game, plus house upgrades',
  'Basho\'s Friday stall in the Shotengai: 5 rare items a week at high prices, one of each',
  'Saturday farmers\' market: seasonal produce, seeds, jam and flowers; buys your crops',
  'Ramen cart at night, a harbour noodle stand and a summer-only shaved ice stand with 5 syrups',
  'Post office: stamps, letter sets, postcards, a rare stamp, and a weekly care package to Mum and Dad on the ship',
  'Vending machines with seasonal hot drinks and a 1-in-50 bonus can',
  'A lucky coin hides under a vending machine some days; peek once a day',
  'Gacha capsule machine at Sunny Mart: 200 coins for 1 of 24 collectible figurines, including a rare golden Mochi, with a reward for the full set',
  'Limited pudding at Sunny Mart on Fridays and Saturdays only, two a week',
  'Limited stock is shown in the shop: rare items say how many are left this week',
  'Take items back out of the shipping box any time before Pip collects it',
  'Shops work with keyboard, mouse and wheel: double-click an item to buy it straight away',
  'Seasonal goods at Sunny Mart: sakura mochi in spring, wind chimes in summer, oden in autumn and winter',
]);
