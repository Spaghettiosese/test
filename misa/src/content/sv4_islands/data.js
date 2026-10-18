// Seto Islands: shared data. State slice, constants (islands, ferry times, fares), items (sea fish, dishes, island goods, rare crops),
// the passport stamp list, the 30 bottle notes and the 24 reef species.
// Save data: state.sv4_islands (see DEFAULT). Flags: seto_visited, seto_licence, seto_boat_rented, seto_boat_own, seto_gears_done,
//   seto_tower_done, seto_chest_<day>, seto_passport_12/24/36, seto_bottles_done, seto_reef_full, seto_stranded.
// Bus events: ferryRide { to }, sailed { tiles }, setoStamp { id }, reefPhoto { id }, bottleRead { n }, regattaDone { place }.
import { register, get } from '../../core/registry.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { itemIcon } from '../../gfx/icons.js';
import '../hobbies/data.js';
import { needItem } from '../hobbies/common.js';

export const DEFAULT = () => ({
  visited: {}, stamps: {}, ferryRides: 0, boat: { rentDay: 0, own: 0, licence: 0, buoys: {}, sailed: 0 },
  bottles: { notes: {}, last: 0, spot: null }, reef: { species: {}, dives: 0 }, daily: {}, drift: { day: 0, taken: {} },
  bungalow: 0, volleyWins: 0, auctionBest: 0, regattaBest: 0, taught: 0, claimed: {}, gears: 0, chest: 0, stranded: 0, cats: {},
});
register('stateSlice', 'sv4_islands', { default: DEFAULT });
export function S4(g) {
  const s = (g.state.sv4_islands ||= DEFAULT()), d = DEFAULT();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  for (const k of Object.keys(d.boat)) if (s.boat[k] === undefined) s.boat[k] = d.boat[k];
  return s;
}
export const todayDone = (g, k) => S4(g).daily[k] === g.day;
export const markDone = (g, k) => { S4(g).daily[k] = g.day; };

export const ISLANDS = {
  tsubame: { name: 'Tsubame Island', map: 'tsubame_pier', spawn: 'from_ferry', fare: 80, mins: 40, blurb: 'a fishing village on stilts' },
  lantern: { name: 'Lantern Isle', map: 'lantern_isle_shore', spawn: 'from_ferry', fare: 120, mins: 55, blurb: 'ruins, caves and a second lighthouse' },
  coral: { name: 'Coral Atoll', map: 'coral_beach', spawn: 'from_ferry', fare: 160, mins: 70, blurb: 'white sand, a lagoon and a night market' },
};
export const ISLAND_MAPS = {
  tsubame: ['tsubame_village', 'tsubame_pier', 'tsubame_inn', 'tsubame_fishery', 'tsubame_school', 'tsubame_shrine', 'tsubame_diner'],
  lantern: ['lantern_isle_shore', 'lantern_ruins', 'lantern_cave', 'lantern_tower', 'lantern_garden'],
  coral: ['coral_beach', 'coral_lagoon', 'coral_hut_resort', 'coral_market'],
};
export const islandOfMap = (id) => Object.keys(ISLAND_MAPS).find((k) => ISLAND_MAPS[k].includes(id)) || null;
export const DEPART = [7 * 60, 9 * 60, 11 * 60, 13 * 60, 15 * 60, 17 * 60];          // from the harbour
export const RETURN = [7 * 60 + 30, 9 * 60 + 30, 11 * 60 + 30, 13 * 60 + 30, 15 * 60 + 30, 17 * 60 + 30];  // from the islands
export const LAST_FERRY = 17 * 60 + 30;
export const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const typhoonSeason = (g) => (g.season === 'summer' && g.state.time && dayOfSeason(g) >= 22) || (g.season === 'autumn' && dayOfSeason(g) <= 6);
function dayOfSeason(g) { return ((g.day - 1) % 28) + 1; }
// Ferries stop on storm days, and in typhoon season also when it is too windy.
export const ferryRunning = (g) => g.weather !== 'storm' && !(typhoonSeason(g) && g.weather === 'windy');
export const nextTime = (list, minutes) => list.find((t) => t >= minutes) ?? null;
export const fareFor = (g, key) => {
  const f = ISLANDS[key].fare;
  return g.check('friend:nagisa>=4') ? Math.round(f / 2) : f;
};

// ---------------------------------------------------------------- items
function item(id, name, cat, price, shape, c, desc, extra = {}) {
  if (get('item', id)) throw new Error('sv4_islands: item id collision ' + id);
  register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c, c2: extra.c2, c3: extra.c3 }), tags: [cat, ...(extra.tags || [])], ...strip(extra) });
  return id;
}
const strip = ({ c2, c3, tags, ...rest }) => rest;

// 14 deep-sea fish: id, name, shape, c, c2, maps, seasons, times, weather, rarity, size, price, desc
const SEA = ['seto_sea', 'tsubame_pier', 'lantern_isle_shore'];
export const SEA_FISH = [
  ['snapper', 'Red snapper', 'fish2', Rr.coral[2], Rr.coral[1], [...SEA, 'coral_beach'], 'all', 'any', 'any', 1, [25, 50], 70, 'A reliable red fish that bites in every season.'],
  ['grouper', 'Grouper', 'fish2', Rr.wood[2], Rr.butter[1], [...SEA, 'coral_beach'], 'all', 'any', 'any', 2, [40, 90], 130, 'Big lips, bigger appetite. Lurks near rocks.'],
  ['barracuda', 'Barracuda', 'fish2', Rr.metal[3], Rr.sky[2], SEA, 'su au', 'day', 'any', 2, [60, 120], 150, 'Long, silver and a little bit smug.'],
  ['amberjack', 'Amberjack', 'fish2', Rr.butter[2], Rr.sky[1], SEA, 'au wi sp', 'day', 'any', 3, [60, 110], 260, 'Kanpachi. A strong fighter with a golden stripe.'],
  ['mahi', 'Mahi-mahi', 'fish2', Rr.mint[2], Rr.butter[2], ['seto_sea', 'coral_beach'], 'su', 'day', 'clear', 3, [70, 130], 320, 'Shines green and gold in summer sun.'],
  ['flyingfish', 'Flying fish', 'fish2', Rr.sky[2], Rr.paper[3], ['seto_sea'], 'su', 'day', 'any', 2, [20, 35], 120, 'Glides over the waves on its long fins.'],
  ['bluefin', 'Bluefin tuna', 'fish2', Rr.navy[2], Rr.metal[3], ['seto_sea', 'lantern_isle_shore'], 'au wi', 'any', 'any', 4, [100, 250], 800, 'The king of the auction. Worth a small fortune.'],
  ['swordfish', 'Swordfish', 'marlin', Rr.navy[3], Rr.metal[2], ['seto_sea'], 'su au', 'night', 'any', 4, [150, 300], 900, 'Its sword glints under the moon.'],
  ['sunfish', 'Ocean sunfish', 'puffer', Rr.metal[3], Rr.paper[3], ['seto_sea'], 'su', 'day', 'clear', 5, [150, 300], 1400, 'A legend: a huge, sleepy disc that sunbathes on calm summer days.'],
  ['oarfish', 'Oarfish', 'eel', Rr.coral[3], Rr.ribbon[2], ['seto_sea'], 'wi', 'night', 'rain', 5, [200, 450], 1600, 'A legend: the ribbon king of the deep, seen only on stormy winter nights.'],
  ['lantern_eel', 'Lantern eel', 'lantern', Rr.butter[3], Rr.mint[2], ['lantern_isle_shore', 'seto_sea'], 'au', 'night', 'any', 4, [40, 90], 700, 'Glows like a paper lantern near the old lighthouse.'],
  ['coral_trout', 'Coral trout', 'fish2', Rr.ribbon[2], Rr.coral[3], ['coral_beach'], 'su au', 'day', 'any', 3, [35, 70], 280, 'Spotted red. Swims in the lagoon channel.'],
  ['parrotfish', 'Parrotfish', 'fish2', Rr.mint[2], Rr.lilac[2], ['coral_beach'], 'su au', 'day', 'any', 2, [30, 60], 140, 'Blue-green and chomping coral all day.'],
  ['manta', 'Manta ray', 'ray', Rr.charcoal[2], Rr.paper[4], ['coral_beach', 'seto_sea'], 'su', 'any', 'any', 5, [200, 400], 1500, 'A legend: a gentle giant gliding past the atoll like a black kite.'],
];
for (const [k, name, shape, c, c2, maps, se, times, weather, rarity, size, price, desc] of SEA_FISH) {
  const id = 'fish_' + k, S = { sp: 'spring', su: 'summer', au: 'autumn', wi: 'winter' };
  item(id, name, 'fish', price, shape, c, desc, { c2, tags: ['fish', k, 'seafish', ...(rarity >= 5 ? ['legend'] : [])], rarity });
  register('fish', id, { item: id, name, maps, seasons: se === 'all' ? ['spring', 'summer', 'autumn', 'winter'] : se.split(' ').map((x) => S[x]), times, weather, rarity, size, legend: rarity >= 5, shape, c });
}

// Tsubame diner dishes (8). id, name, shape, colour, ingredients, energy, mood, buff, time, price, desc
const ing = (s) => Object.fromEntries(s.split(' ').map((t) => {
  const [k, n] = t.split('*');
  const id = k.includes(':') || /^(fish|dish|drink|crop|shell|bug|min|mat)_/.test(k) ? k : needItem('ing_' + k, { cat: 'food', tags: ['ingredient'] });
  return [id, +(n || 1)];
}));
export const DISHES = [
  ['dish_ts_kaisendon', 'Tsubame kaisendon', 'bowl', Rr.coral[2], 'rice tag:fish*2 soy', 90, 12, 'lucky:180', 25, 520, 'A rice bowl heaped with the morning catch.'],
  ['dish_ts_dried_squid', 'Sun-dried squid', 'skewer', Rr.paper[3], 'fish_squid salt', 45, 8, '', 15, 300, 'Dried on the village racks, then grilled over charcoal.'],
  ['dish_ts_fish_soup', 'Fisherman fish soup', 'pot', Rr.wood[3], 'tag:fish dashi negi', 70, 10, 'cozy:180', 25, 380, 'Clear, salty and warm. Chunks of fish in every spoon.'],
  ['dish_ts_octopus_rice', 'Octopus rice', 'bowl', Rr.coral[1], 'fish_octopus rice soy', 80, 11, 'chef:180', 30, 480, 'Takomeshi: rice steamed with soy and tender octopus.'],
  ['dish_ts_bream_salt', 'Salt-grilled bream', 'fishplate', Rr.coral[3], 'fish_sea_bream salt', 75, 10, 'lucky:120', 20, 450, 'A whole red bream, crackling with sea salt.'],
  ['dish_ts_tuna_don', 'Bluefin tuna don', 'bowl', Rr.ribbon[2], 'fish_bluefin rice soy', 110, 16, 'focus:240', 25, 900, 'Glossy slices of bluefin on warm rice. A treat.'],
  ['dish_ts_seaweed_salad', 'Island seaweed salad', 'bowl', Rr.forest[3], 'crop_seaweed cucumber vinegar', 40, 7, 'green:120', 10, 220, 'Crunchy sea greens with a sharp vinegar dressing.'],
  ['dish_ts_nabe', 'Tsubame fisher nabe', 'pot', Rr.coral[2], 'tag:fish*2 tofu daikon', 100, 14, 'cozy:240', 40, 560, 'A bubbling pot the fishers share after a cold trip.'],
];
for (const [id, name, shape, c, ingr, energy, mood, buff, time, price, desc] of DISHES) {
  const [bid, bmin] = buff ? buff.split(':') : [];
  item(id, name, 'food', price, shape, c, desc, { energy, mood, tags: ['dish', 'seafood', 'island'], buff: bid ? { id: bid, min: +bmin } : null });
  register('recipe', id, { name, ingredients: ing(ingr), out: id, time, steps: ['chop', 'stir', 'fry'], station: 'kitchen', learned: false, skill: null, from: null, hidden: true, story: false, island: true });
}
// Coral market snacks / drinks (sold, not cooked)
item('drink_coconut_juice', 'Coconut juice', 'food', 90, 'glassdrink', Rr.paper[4], 'Fresh from the nut, with a tiny paper umbrella.', { energy: 30, mood: 12, tags: ['drink', 'island'] });
item('drink_tropic_smoothie', 'Tropic smoothie', 'food', 140, 'glassdrink', Rr.hairGinger[2], 'Mango, pineapple and a splash of lime.', { energy: 45, mood: 16, tags: ['drink', 'island', 'sweet'], buff: { id: 'swift', min: 120 } });
item('dish_coral_shaved_ice', 'Blue lagoon shaved ice', 'food', 120, 'sweet', Rr.sky[2], 'Shaved ice the colour of the lagoon.', { energy: 25, mood: 16, tags: ['dish', 'island', 'sweet', 'dessert'] });
item('dish_grilled_corn_bar', 'Beach bar skewers', 'food', 160, 'skewer', Rr.hairGinger[2], 'Smoky grilled prawns and pineapple.', { energy: 55, mood: 11, tags: ['dish', 'island'] });
item('snack_coconut_chips', 'Coconut chips', 'food', 60, 'sweet', Rr.paper[3], 'Toasted, crunchy and slightly sweet.', { energy: 18, mood: 6, tags: ['snack', 'island'] });

// island goods and treasure
item('tool_snorkel', 'Snorkel set', 'tool', 400, 'tool', Rr.sky[2], 'A mask, snorkel and fins. Needed to dive in the Coral Lagoon.', { tags: ['tool'] });
item('mat_sea_glass', 'Sea glass', 'material', 60, 'gem', Rr.mint[3], 'A frosted green fragment, smoothed by years of waves.', { tags: ['material', 'beach'] });
item('mat_glass_float', 'Glass float', 'material', 180, 'bottle', Rr.sky[2], 'An old fishing float, blue as the deep.', { tags: ['material', 'beach'] });
item('mat_driftwood_branch', 'Driftwood branch', 'material', 40, 'tool', Rr.wood[3], 'Silver-grey and light as paper.', { tags: ['material'] });
item('mat_pearl', 'Pearl', 'material', 450, 'gem', Rr.paper[4], 'A small round pearl with a faint rose glow.', { tags: ['material', 'valuable'] });
item('mat_sea_salt_flake', 'Island sea salt', 'material', 50, 'jar', Rr.paper[4], 'Hand-raked salt from the Tsubame salt pans.', { tags: ['material', 'seasoning'] });
item('min_sunken_coin', 'Sunken coin', 'mineral', 350, 'coin', Rr.butter[2], 'A gold coin from a ship nobody remembers.', { tags: ['mineral', 'treasure'] });
item('min_glow_moss', 'Glow moss', 'mineral', 120, 'leafy', Rr.mint[2], 'A damp cushion of moss that glows pale green.', { tags: ['mineral', 'cave'] });
item('gift_shell_wind_chime', 'Shell wind chime', 'gift', 260, 'shell', Rr.sakura[3], 'Shells that click like tiny rain on a window.', { tags: ['handmade', 'beach', 'gift'] });
item('gift_sea_glass_bracelet', 'Sea glass bracelet', 'gift', 320, 'gem', Rr.mint[3], 'Green and blue glass on a waxed cord.', { tags: ['handmade', 'beach', 'gift'] });
item('gift_pearl_pin', 'Pearl hairpin', 'gift', 600, 'star', Rr.paper[4], 'A pearl set in a silver wave.', { tags: ['handmade', 'gift', 'valuable'] });
item('gift_conch_horn', 'Conch horn', 'gift', 220, 'shell', Rr.sand[3], 'Blow gently. It sounds like the sea saying hello.', { tags: ['handmade', 'beach', 'gift'] });
item('gift_old_compass', 'Old compass', 'gift', 500, 'tool', Rr.butter[2], 'Its needle always swings toward Lantern Isle.', { tags: ['treasure', 'gift'] });
item('gift_astrolabe', 'Brass astrolabe', 'gift', 1200, 'star', Rr.butter[2], 'From the ruined observatory. Perfect for stargazers.', { tags: ['treasure', 'gift', 'stars'] });
item('gift_tsubame_charm', 'Tsubame safe-voyage charm', 'gift', 200, 'feather', Rr.sky[2], 'A swallow charm for safe journeys.', { tags: ['gift', 'luck'] });
item('gift_golden_stamp', 'Golden passport seal', 'gift', 1500, 'stamp', Rr.butter[3], 'Proof you have been everywhere in the Seto Islands.', { tags: ['gift', 'valuable'] });
item('gift_beach_ball', 'Beach ball', 'gift', 90, 'toy', Rr.coral[2], 'Bright stripes, slightly sandy.', { tags: ['toy', 'gift', 'beach'] });
item('furn_shell_lantern', 'Shell lantern', 'decor', 380, 'furniture', Rr.sand[3], 'A glowing lantern made from pearly shells.', { tags: ['beach', 'decor'] });
item('furn_bottle_ship', 'Ship in a bottle', 'decor', 700, 'bottle', Rr.sky[2], 'A tiny ship that sails on a sea of glass.', { tags: ['decor', 'treasure'] });
item('furn_lighthouse_model', 'Tower model', 'decor', 800, 'furniture', Rr.paper[4], 'A little model of the Lantern Isle tower. The lamp blinks.', { tags: ['decor', 'treasure'] });
item('furn_coral_aquarium', 'Reef aquarium', 'decor', 1500, 'furniture', Rr.sky[1], 'A glowing tank of tiny reef fish. A perfect Reef Guide reward.', { tags: ['decor', 'nature'] });
item('furn_hammock', 'Island hammock', 'decor', 900, 'furniture', Rr.coral[2], 'Strung between two palms. You never want to get up.', { tags: ['decor', 'beach'] });
item('furn_pirate_flag', 'Pirate flag', 'decor', 600, 'paper', Rr.charcoal[2], 'A skull with a very friendly grin.', { tags: ['decor', 'treasure'] });

// rare crops from the Lantern garden: id, name, kind, c, c2, seasons, days, regrow, seed price, price
export const RARE = [
  ['moonbloom', 'Moonbloom', 'flower', Rr.lilac[3], Rr.paper[4], ['summer', 'autumn'], 7, 0, 180, 400],
  ['sea_grape', 'Sea grape', 'vine', Rr.mint[2], Rr.forest[2], ['summer'], 8, 3, 150, 220],
  ['lantern_pepper', 'Lantern pepper', 'vine', Rr.hairGinger[2], Rr.ribbon[2], ['autumn'], 7, 3, 160, 260],
  ['star_jasmine', 'Star jasmine', 'flower', Rr.paper[4], Rr.butter[2], ['spring', 'summer'], 6, 0, 170, 360],
];
for (const [k, name, kind, c, c2, seasons, days, regrow, seedPrice, price] of RARE) {
  const flower = kind === 'flower', it = 'crop_' + k, sd = 'seed_' + k;
  item(it, name, 'crop', price, flower ? 'flower' : 'fruit', c, flower ? `A rare ${name.toLowerCase()} from the walled garden on Lantern Isle.` : `A rare ${name.toLowerCase()} with a sweet bite.`, { c2, tags: [flower ? 'flower' : 'veg', k, 'rare'], energy: flower ? 0 : 20, mood: flower ? 0 : 5 });
  item(sd, `${name} seeds`, 'seed', Math.round(seedPrice / 2), 'seed', c, `Grows in ${seasons.join(' and ')} in ${days} days${regrow ? `, then every ${regrow} days` : ''}. Rare Lantern Isle seeds.`, { buy: seedPrice, tags: ['seed'], crop: it, seasons,
    useLabel: 'Plant these next', use: (g) => { g.state.hobbies.seed = sd; g.toast(`Ready to plant ${name.toLowerCase()}`, get('item', sd).icon); return true; } });
  register('crop', it, { seed: sd, item: it, name, seasons, days, regrow, kind, flower, c, c2 });
}

// ---------------------------------------------------------------- passport stamps: [id, island, name, hint]
export const STAMPS = [
  ['ts_arrive', 'tsubame', 'Welcome to Tsubame', 'Arrive on Tsubame Island'], ['ts_cat', 'tsubame', 'Roof cat', 'Greet a cat on a roof'], ['ts_squid', 'tsubame', 'Squid racks', 'Look at the drying squid'],
  ['ts_inn', 'tsubame', 'Inn guest', 'Sleep at the Tsubame inn'], ['ts_auction', 'tsubame', 'Auction winner', 'Win a lot at the fishery auction'], ['ts_school', 'tsubame', 'Little school', 'Visit the one-room school'],
  ['ts_shrine', 'tsubame', 'Swallow shrine', 'Pray at the island shrine'], ['ts_diner', 'tsubame', 'Island meal', 'Eat at the diner'], ['ts_fish', 'tsubame', 'Sea catch', 'Catch a sea fish off the pier'],
  ['ts_net', 'tsubame', 'Net mender', 'Help mend a fishing net'], ['ts_shells', 'tsubame', 'Shell crafts', 'Buy from the shell shop'], ['ts_teach', 'tsubame', 'Guest teacher', 'Volunteer at the school'],
  ['li_arrive', 'lantern', 'Welcome to Lantern Isle', 'Arrive on Lantern Isle'], ['li_glass', 'lantern', 'Sea glass', 'Find sea glass on the shore'], ['li_ruins', 'lantern', 'Old observatory', 'Enter the ruins'],
  ['li_gears', 'lantern', 'Gears and stars', 'Solve the gear puzzle'], ['li_cave', 'lantern', 'Tidal cave', 'Enter the tidal cave'], ['li_moss', 'lantern', 'Glowing moss', 'See the moss glow at night'],
  ['li_chest', 'lantern', 'Sunken chest', 'Open the sunken chest'], ['li_tower', 'lantern', 'Tower climb', 'Climb the tower stairs'], ['li_garden', 'lantern', 'Walled garden', 'Step into the garden'],
  ['li_seed', 'lantern', 'Rare harvest', 'Harvest a rare Lantern crop'], ['li_view', 'lantern', 'Lamp room view', 'Look out from the tower at dusk'], ['li_orin', 'lantern', 'Keeper story', 'Hear the lighthouse legend'],
  ['co_arrive', 'coral', 'Welcome to Coral Atoll', 'Arrive on Coral Atoll'], ['co_bar', 'coral', 'Beach bar', 'Order at the beach bar'], ['co_volley', 'coral', 'Volleyball', 'Play beach volleyball'],
  ['co_dive', 'coral', 'First dive', 'Snorkel in the lagoon'], ['co_reef10', 'coral', 'Reef scout', 'Photograph 10 reef species'], ['co_reef24', 'coral', 'Reef expert', 'Photograph all 24 reef species'],
  ['co_bungalow', 'coral', 'Overwater night', 'Sleep in a bungalow'], ['co_market', 'coral', 'Night market', 'Visit the night market'], ['co_bonfire', 'coral', 'Sunset bonfire', 'Join the sunset bonfire'],
  ['co_star', 'coral', 'Shooting star', 'Watch a shooting star'], ['co_photo', 'coral', 'Underwater photo', 'Take a rare reef photo'], ['co_regatta', 'coral', 'Regatta', 'Take part in the regatta'],
];
export const stampsOf = (g, island) => STAMPS.filter((s) => s[1] === island && S4(g).stamps[s[0]]).length;
export const stampTotal = (g) => Object.keys(S4(g).stamps).length;
export function stamp(g, id) {
  const s = S4(g), def = STAMPS.find((x) => x[0] === id);
  if (!def || s.stamps[id]) return false;
  s.stamps[id] = g.day; g.toast(`Seto Passport stamp: ${def[2]}`, 'i_star'); g.sfx('chime'); g.stat('setoStamps');
  g.bus.emit('setoStamp', { id });
  return true;
}
export const PASSPORT_REWARDS = [
  [12, 'Bronze seal', { money: 400, items: { gift_tsubame_charm: 1 } }], [24, 'Silver seal', { money: 800, items: { mat_pearl: 1, furn_hammock: 1 } }], [36, 'Golden seal', { money: 2000, items: { gift_golden_stamp: 1 } }],
];

// ---------------------------------------------------------------- 30 notes in bottles
export const NOTES = [
  'To whoever finds this: the sea is big, but I am not alone. - a girl on Tsubame',
  'Today I caught a fish bigger than my brother. He says it was the same size. It was not.',
  'The lantern on the island blinked twice last night. I counted. - Kenta',
  'If you read this, please wave at the sea. Someone is waving back.',
  'Grandpa says never whistle on a boat. I whistled. The fish liked it.',
  'I hid a sweet in the third rock from the pier. Finders keepers!',
  'The squid racks look like a hundred little ghosts at dusk. I love them.',
  'Dear stranger, the ferry is always late when you are in a hurry and early when you are not.',
  'I am learning the stars. The astrolabe says the third star is called Tsubame, the swallow.',
  'We held a school picnic on the rocks. The crab ate my rice ball. I forgive him.',
  'A message from the lighthouse: the lamp is only half a light. Look for the other half.',
  'If you are sad, put your ear to a shell. The sea tells the same story gently, over and over.',
  'I saw a whale today. Nobody believes me. I believe me.',
  'Tell the gulls I said hello. They know me. I am the one with the sandwich.',
  'The moss in the cave glows when it is happy. Do not step on it. It is happy.',
  'Someone left a pearl in my shoe. If it was you, thank you.',
  'Today the sea was flat as a mirror, and I rowed on the sky.',
  'I wrote a wish and threw it in the waves. Now it is yours to carry for a while.',
  'The old observatory has gears that remember the sky. Be gentle with them.',
  'Dear friend, may your nets be full, your tea hot and your socks dry.',
  'On Coral Atoll the water is so clear that the fish look like they are flying.',
  'My sister and I sang to the manta. It stayed for the whole chorus.',
  'A fisher always leaves one fish for the sea. It is polite.',
  'The night market smells of grilled corn and lantern oil. Come hungry.',
  'I counted forty-one shooting stars last summer. This year I am aiming for forty-two.',
  'When the typhoon comes, the whole island hums. We drink tea and tell stories until it passes.',
  'To the finder: a lighthouse keeper once wrote, "the sea keeps what it loves." I think it keeps you, too.',
  'I do not know who you are, but I hope you are having a lovely day.',
  'We are building a boat. It leaks. It is beautiful. Come to the regatta!',
  'You found the last one. Thank you for reading every word. The sea is proud of you.',
];

// ---------------------------------------------------------------- 24 reef species: id, name, band (0 shallow .. 1 deep), weight, night-only, rare photo
export const REEF = [
  ['clownfish', 'Clownfish', 0.25, 5, false, Rr.hairGinger[2]], ['bluetang', 'Blue tang', 0.35, 5, false, Rr.sky[2]], ['butterfly', 'Butterflyfish', 0.3, 4, false, Rr.butter[2]],
  ['idol', 'Moorish idol', 0.4, 3, false, Rr.paper[4]], ['parrot', 'Parrotfish', 0.45, 4, false, Rr.mint[2]], ['angel', 'Emperor angelfish', 0.5, 3, false, Rr.lilac[2]],
  ['lionfish', 'Lionfish', 0.55, 3, false, Rr.ribbon[2]], ['puffer', 'Porcupine puffer', 0.5, 3, false, Rr.sand[2]], ['seahorse', 'Seahorse', 0.2, 2, false, Rr.butter[3]],
  ['cuttle', 'Cuttlefish', 0.6, 2, false, Rr.coral[2]], ['reefoct', 'Reef octopus', 0.65, 2, false, Rr.coral[1]], ['moray', 'Zebra moray', 0.7, 2, false, Rr.butter[1]],
  ['turtle', 'Green sea turtle', 0.45, 2, false, Rr.forest[2]], ['manta', 'Manta ray', 0.75, 1, false, Rr.charcoal[2]], ['reefshark', 'Blacktip reef shark', 0.8, 1, false, Rr.metal[3]],
  ['eagleray', 'Spotted eagle ray', 0.7, 1, false, Rr.navy[2]], ['moonjelly', 'Moon jellyfish', 0.35, 3, false, Rr.lilac[3]], ['nudibranch', 'Nudibranch', 0.9, 2, false, Rr.sakura[2]],
  ['starfish', 'Blue starfish', 0.95, 3, false, Rr.sky[3]], ['urchin', 'Sea urchin', 0.9, 3, false, Rr.charcoal[3]], ['clam', 'Giant clam', 0.92, 2, false, Rr.mint[1]],
  ['shrimp', 'Cleaner shrimp', 0.85, 2, false, Rr.ribbon[3]], ['glowfish', 'Flashlight fish', 0.6, 2, true, Rr.mint[3]], ['whaleshark', 'Whale shark', 0.55, 1, true, Rr.navy[3]],
];
export const reefCount = (g) => Object.keys(S4(g).reef.species).length;

// Hobbies fish data is read lazily; make sure the sea map exists in the fish pool test (validator checks maps exist at the end of loading).
export const have = (list) => list.filter((id) => get('item', id));
