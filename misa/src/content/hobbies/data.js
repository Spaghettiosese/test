// Hobbies data: fish, bugs, shells, minerals, crops + seeds, constellations, dishes + cooking recipes, crafts.
// Schemas (documented for other areas):
//   register('fish', id, { item, name, maps: [...], seasons: [...], times: 'day'|'night'|..., weather: 'any'|'rain'|'clear'|'storm',
//                          rarity: 1-5, size: [minCm, maxCm], legend? })
//   register('bug', id, { item, habitat: 'flower'|'grass'|'tree'|'water'|'sand', seasons, times, weather, rarity, kind (world sprite), maps? })
//   register('collectible', id, { item, kind: 'shell'|'mineral', where: ['beach'|'cave'|'dig'|'rock'], rarity, storm? })
//   register('crop', id, { seed, item, seasons, days, regrow?, kind, flower? })
//   register('constellation', id, { name, season, stars: [[x,y]...] (0-100 x 0-60), path: [i, i, ..., -1 (pen up), ...], lore })
//   register('recipe', id, { name, ingredients: { itemId | 'tag:x': n }, out, time, skill?, learned?, from?, hidden?, story?, steps })
//   register('craft', id, { name, ingredients, out, n?, skill? })
// Ingredient tags: 'tag:tomato' matches crop_tomato, ing_tomato or any item tagged 'tomato'.
import { register, get, all } from '../../core/registry.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { itemIcon } from '../../gfx/icons.js';
import './icons.js';
import { needItem, liveMaps, HS } from './common.js';

const SEAS = { sp: 'spring', su: 'summer', au: 'autumn', wi: 'winter' };
const seasons = (s) => (s === 'all' ? ['spring', 'summer', 'autumn', 'winter'] : s.split(' ').map((k) => SEAS[k]));
// The list of maps is resolved when read, so maps landing later (coast) are picked up and missing ones never break validation.
const lazyMaps = (def, list) => Object.defineProperty(def, 'maps', { enumerable: true, configurable: true, get: () => liveMaps(list) });

// ================================================================ FISH (30)
export const FISH = [
  // id, name, shape, colour, colour2, maps, seasons, times, weather, rarity, size, price, desc
  ['crucian', 'Crucian carp', 'fish2', Rr.butter[1], Rr.wood[2], 'park', 'all', 'any', 'any', 1, [10, 25], 30, 'A round little pond carp. Patient and friendly.'],
  ['carp', 'Carp', 'fish2', Rr.wood[2], Rr.wood[1], 'park', 'sp su au', 'day', 'any', 1, [30, 70], 60, 'Big, whiskery and wise-looking.'],
  ['sakura_koi', 'Sakura koi', 'fish2', Rr.sakura[2], Rr.paper[4], 'park', 'sp', 'morning', 'clear', 5, [50, 90], 900, 'A legend of the park pond. Its scales look like falling petals.'],
  ['goldfish', 'Goldfish', 'fish2', Rr.hairGinger[2], Rr.coral[2], 'park', 'su', 'day', 'any', 2, [6, 15], 80, 'Someone\'s festival goldfish, all grown up.'],
  ['catfish', 'Catfish', 'fish2', Rr.charcoal[3], Rr.charcoal[2], 'park', 'su au', 'night', 'rain', 3, [30, 60], 200, 'Comes out on rainy nights. Mochi would be very interested.'],
  ['loach', 'Pond loach', 'eel', Rr.dirt[3], Rr.dirt[2], 'park', 'sp su', 'any', 'any', 1, [8, 15], 35, 'A wriggly bottom-dweller. Wiggles when it rains.'],
  ['bluegill', 'Bluegill', 'fish2', Rr.sky[1], Rr.butter[2], 'park', 'all', 'day', 'any', 1, [10, 20], 40, 'Easy to catch, easy to love.'],
  ['smelt', 'Pond smelt', 'fish2', Rr.metal[3], Rr.metal[2], 'park', 'wi', 'any', 'any', 2, [8, 14], 70, 'A slim, silvery winter fish.'],
  ['medaka', 'Rice fish', 'fish2', Rr.paper[2], Rr.butter[2], 'park', 'sp su', 'day', 'any', 1, [2, 4], 25, 'Tiny medaka. Usually seen in a school of twenty.'],
  ['eel', 'River eel', 'eel', Rr.forest[2], Rr.forest[1], 'park', 'su au', 'night', 'rain', 3, [40, 90], 250, 'Slippery and strong. Comes out on rainy nights.'],
  ['bass', 'Black bass', 'fish2', Rr.forest[3], Rr.forest[1], 'park', 'sp su au', 'any', 'any', 2, [25, 55], 110, 'A fighter. Hates letting go of the line.'],
  ['horse_mackerel', 'Horse mackerel', 'fish2', Rr.metal[3], Rr.sky[2], 'harbour beach', 'all', 'day', 'any', 1, [15, 30], 45, 'Aji! A harbour favourite.'],
  ['sardine', 'Sardine', 'fish2', Rr.sky[2], Rr.metal[3], 'harbour', 'sp su', 'any', 'any', 1, [10, 20], 30, 'Shiny and quick. Travels in huge schools.'],
  ['mackerel', 'Mackerel', 'fish2', Rr.mint[1], Rr.sky[1], 'harbour', 'au wi', 'any', 'any', 2, [25, 45], 90, 'Stripy and full of energy. Perfect grilled.'],
  ['sea_bream', 'Red sea bream', 'fish2', Rr.coral[2], Rr.coral[1], 'harbour', 'sp au', 'day', 'any', 3, [30, 60], 240, 'Tai. A lucky fish for celebrations.'],
  ['rockfish', 'Rockfish', 'fish2', Rr.brick[2], Rr.brick[1], 'harbour cave', 'all', 'night', 'any', 2, [15, 35], 90, 'Hides between the pier stones at night.'],
  ['squid', 'Squid', 'squid', Rr.paper[3], Rr.coral[3], 'harbour', 'wi sp', 'night', 'any', 2, [20, 40], 110, 'Drawn to lights on winter nights.'],
  ['octopus', 'Octopus', 'octopus', Rr.coral[1], Rr.coral[0], 'harbour cave', 'su', 'any', 'any', 3, [30, 70], 220, 'Very clever. Tried to steal the bait twice.'],
  ['flounder', 'Flounder', 'flat', Rr.sand[2], Rr.sand[1], 'harbour beach', 'wi sp', 'any', 'any', 2, [20, 45], 120, 'Flat as a pancake, both eyes on one side.'],
  ['yellowtail', 'Yellowtail', 'fish2', Rr.sky[1], Rr.butter[2], 'harbour', 'wi', 'day', 'any', 3, [50, 90], 300, 'Buri. Fat and fast in winter.'],
  ['moon_bream', 'Moon bream', 'fish2', Rr.lilac[3], Rr.paper[4], 'harbour', 'au', 'night', 'clear', 5, [40, 80], 1000, 'A legend: it only bites under a clear autumn moon.'],
  ['whiting', 'Sand whiting', 'fish2', Rr.sand[3], Rr.paper[2], 'beach', 'sp su', 'day', 'any', 1, [15, 25], 50, 'Kisu. Hides in the sandy shallows.'],
  ['puffer', 'Pufferfish', 'puffer', Rr.butter[2], Rr.dirt[2], 'beach harbour', 'su au', 'day', 'any', 2, [10, 30], 140, 'Puffs up when surprised. So does Misa.'],
  ['bonito', 'Skipjack bonito', 'fish2', Rr.navy[2], Rr.metal[3], 'beach', 'su', 'day', 'any', 3, [40, 80], 260, 'Katsuo. Races through summer waves.'],
  ['ray', 'Stingray', 'ray', Rr.dirt[2], Rr.dirt[1], 'beach', 'su au', 'any', 'any', 3, [40, 100], 230, 'Glides over the sand like a kite.'],
  ['storm_marlin', 'Storm marlin', 'marlin', Rr.navy[3], Rr.sky[3], 'beach', 'su', 'any', 'storm', 5, [150, 300], 1500, 'A legend: it leaps only in summer storms.'],
  ['goby', 'Rock goby', 'fish2', Rr.stone[3], Rr.stone[2], 'cave', 'all', 'any', 'any', 1, [5, 12], 35, 'Lives in the cave pools. Hops on its fins.'],
  ['glassfish', 'Glass minnow', 'fish2', Rr.water[4], Rr.water[3], 'cave', 'all', 'any', 'any', 2, [3, 7], 90, 'See-through! You can see its tiny heart.'],
  ['moray', 'Moray eel', 'eel', Rr.butter[1], Rr.forest[1], 'cave', 'su au', 'any', 'any', 3, [50, 120], 280, 'Peeks out of the rocks with a grumpy face.'],
  ['ice_lantern', 'Ice lantern fish', 'lantern', Rr.sky[3], Rr.sky[1], 'cave', 'wi', 'night', 'any', 5, [20, 40], 1200, 'A legend: its little lantern glows on winter nights.'],
];
for (const [k, name, shape, c, c2, maps, se, times, weather, rarity, size, price, desc] of FISH) {
  const item = 'fish_' + k;
  register('item', item, { name, desc, cat: 'fish', price, icon: itemIcon(shape, { c, c2 }), tags: ['fish', k, ...(rarity >= 5 ? ['legend'] : [])], rarity });
  lazyMaps(register('fish', item, { item, name, seasons: seasons(se), times, weather, rarity, size, legend: rarity >= 5, shape, c }), maps.split(' '));
}

// ================================================================ BUGS (30)
export const BUGS = [
  // id, name, shape, c, c2, habitat, seasons, times, weather, rarity, price, desc, world kind
  ['cabbage_white', 'Cabbage white', 'butterfly', Rr.paper[4], Rr.paper[2], 'flower', 'sp su', 'day', 'clear', 1, 30, 'A soft white butterfly that loves vegetable gardens.', 'fly'],
  ['swallowtail', 'Swallowtail', 'butterfly', Rr.butter[2], Rr.charcoal[2], 'flower', 'sp su', 'day', 'clear', 2, 90, 'Big yellow wings with black stripes.', 'fly'],
  ['purple_emperor', 'Purple emperor', 'butterfly', Rr.lilac[1], Rr.lilac[2], 'tree', 'su', 'day', 'clear', 3, 260, 'Japan\'s national butterfly. Shimmers purple in the sun.', 'fly'],
  ['chestnut_tiger', 'Chestnut tiger', 'butterfly', Rr.sky[3], Rr.wood[1], 'flower', 'su au', 'day', 'clear', 3, 220, 'Flies across the sea every year. A tiny traveller.', 'fly'],
  ['red_dragonfly', 'Red dragonfly', 'dragonfly', Rr.ribbon[2], Rr.ribbon[1], 'water', 'au', 'day', 'any', 1, 40, 'Akatombo. Autumn has arrived when these appear.', 'dart'],
  ['skimmer', 'Blue skimmer', 'dragonfly', Rr.sky[2], Rr.navy[2], 'water', 'su', 'day', 'clear', 1, 45, 'Patrols the pond edge all summer.', 'dart'],
  ['damselfly', 'Damselfly', 'dragonfly', Rr.mint[2], Rr.mint[1], 'water', 'sp su', 'day', 'any', 2, 80, 'A dainty dragonfly cousin with a needle body.', 'dart'],
  ['firefly', 'Firefly', 'firefly', Rr.charcoal[2], Rr.coral[2], 'water', 'su', 'night', 'clear', 2, 150, 'Blinks gently by the water on summer nights.', 'glow'],
  ['cicada', 'Brown cicada', 'cicada', Rr.wood[1], Rr.wood[2], 'tree', 'su', 'day', 'clear', 1, 50, 'The sound of summer. Very, very loud.', 'cling'],
  ['higurashi', 'Evening cicada', 'cicada', Rr.forest[2], Rr.wood[2], 'tree', 'su', 'dusk', 'any', 2, 120, 'Sings kana-kana-kana at sunset.', 'cling'],
  ['rhino_beetle', 'Rhinoceros beetle', 'beetle', Rr.woodDark[2], Rr.woodDark[1], 'tree', 'su', 'night', 'any', 3, 300, 'The king of summer bugs. Strong horn, gentle heart.', 'cling'],
  ['stag_beetle', 'Stag beetle', 'stag', Rr.woodDark[2], Rr.charcoal[2], 'tree', 'su', 'night', 'any', 3, 280, 'Big pincers. Kai and Hina argue about which is best.', 'cling'],
  ['rainbow_stag', 'Rainbow stag', 'stag', Rr.mint[2], Rr.lilac[2], 'tree', 'su', 'night', 'clear', 5, 1200, 'A shimmering stag beetle in every colour. Hina\'s dream bug.', 'cling'],
  ['ladybug', 'Ladybug', 'ladybug', Rr.ribbon[2], Rr.ribbon[1], 'flower', 'sp au wi', 'day', 'any', 1, 30, 'Seven spots. Lucky if it lands on you.', 'crawl'],
  ['honeybee', 'Honeybee', 'bug', Rr.butter[2], Rr.wood[1], 'flower', 'sp su', 'day', 'clear', 1, 40, 'Busy, buzzy and very polite.', 'fly'],
  ['grasshopper', 'Grasshopper', 'hopper', Rr.forest[3], Rr.forest[2], 'grass', 'su au', 'day', 'any', 1, 35, 'Boing! Hops away right when you get close.', 'hop'],
  ['bell_cricket', 'Bell cricket', 'hopper', Rr.charcoal[2], Rr.charcoal[1], 'grass', 'au', 'night', 'any', 2, 130, 'Suzumushi. Rings like a tiny bell on autumn nights.', 'hop'],
  ['mantis', 'Praying mantis', 'mantis', Rr.forest[3], Rr.forest[2], 'grass', 'au', 'day', 'any', 2, 140, 'Looks very serious about everything.', 'crawl'],
  ['pill_bug', 'Pill bug', 'pillbug', Rr.stone[2], Rr.stone[1], 'grass', 'all', 'any', 'any', 1, 20, 'Rolls into a ball when shy. Relatable.', 'crawl'],
  ['snail', 'Snail', 'snail', Rr.wood[2], Rr.wood[1], 'grass', 'sp su', 'any', 'rain', 1, 35, 'Comes out to enjoy the rain. Slowly.', 'crawl'],
  ['ant', 'Ant', 'ant', Rr.ribbon[0], Rr.charcoal[1], 'grass', 'sp su au', 'day', 'clear', 1, 15, 'One of a million. Carries ten times its weight.', 'crawl'],
  ['moon_moth', 'Moon moth', 'moth', Rr.mint[3], Rr.mint[2], 'tree', 'su', 'night', 'any', 4, 450, 'Oomizuao. Pale green wings like moonlight.', 'fly'],
  ['jewel_beetle', 'Jewel beetle', 'beetle', Rr.mint[2], Rr.ribbon[2], 'tree', 'su', 'day', 'clear', 4, 500, 'Its shell glitters like green metal.', 'cling'],
  ['walking_stick', 'Walking stick', 'hopper', Rr.wood[3], Rr.wood[2], 'tree', 'su au', 'any', 'any', 3, 210, 'Pretends to be a twig. Very convincing.', 'cling'],
  ['water_strider', 'Water strider', 'strider', Rr.charcoal[3], Rr.charcoal[2], 'water', 'sp su', 'day', 'any', 1, 30, 'Skates across the water on tiny feet.', 'crawl'],
  ['diving_beetle', 'Diving beetle', 'beetle', Rr.forest[1], Rr.butter[1], 'water', 'su', 'any', 'any', 3, 220, 'Swims with its legs like oars.', 'crawl'],
  ['tiger_beetle', 'Tiger beetle', 'beetle', Rr.coral[2], Rr.mint[2], 'sand', 'su', 'day', 'clear', 2, 120, 'Runs ahead on sandy paths, then waits for you.', 'crawl'],
  ['winter_moth', 'Winter moth', 'moth', Rr.stone[3], Rr.stone[2], 'tree', 'wi', 'night', 'any', 2, 110, 'Flutters in the cold when nothing else does.', 'fly'],
  ['snow_fairy', 'Woolly aphid', 'fluff', Rr.sky[2], Rr.sky[1], 'grass', 'wi au', 'day', 'any', 2, 140, 'Yukimushi. A drifting puff of snow. Means real snow is coming.', 'fly'],
  ['orb_spider', 'Orb spider', 'spider', Rr.butter[2], Rr.charcoal[1], 'tree', 'au', 'any', 'any', 2, 90, 'Builds a perfect web. Not technically a bug. Still counts!', 'cling'],
];
for (const [k, name, shape, c, c2, habitat, se, times, weather, rarity, price, desc, kind] of BUGS) {
  const item = 'bug_' + k;
  register('item', item, { name, desc, cat: 'bug', price, icon: itemIcon(shape, { c, c2 }), tags: ['bug', k], rarity });
  register('bug', item, { item, name, habitat, seasons: seasons(se), times, weather, rarity, kind, shape, c, c2 });
}

// ================================================================ SHELLS & BEACH FINDS (20), MINERALS & FOSSILS (12)
export const SHELLS = [
  // id, name, shape, c, c2, where, rarity, price, desc
  ['clam', 'Clam shell', 'shell', Rr.paper[2], Rr.wood[2], 'beach', 1, 15, 'A plain little clam shell. Still pretty.'],
  ['scallop', 'Scallop shell', 'scallop', Rr.coral[3], Rr.coral[2], 'beach', 1, 25, 'A fan-shaped shell with pink ridges.'],
  ['spiral', 'Spiral shell', 'conch', Rr.paper[3], Rr.wood[3], 'beach', 1, 20, 'A tiny spiral. Hold it to your ear.'],
  ['cockle', 'Cockle shell', 'shell', Rr.butter[3], Rr.wood[2], 'beach', 1, 20, 'Ridged and heart-shaped from the side.'],
  ['razor', 'Razor shell', 'eel', Rr.wood[3], Rr.wood[2], 'beach', 2, 30, 'Long and thin, like a little pencil case.'],
  ['moon_snail', 'Moon snail', 'conch', Rr.sand[3], Rr.lilac[3], 'beach', 2, 40, 'Round and smooth with a swirl like the moon.'],
  ['cowrie', 'Cowrie', 'cowrie', Rr.wood[3], Rr.paper[4], 'beach', 2, 60, 'Glossy, spotted and once used as money.'],
  ['conch', 'Conch', 'conch', Rr.coral[3], Rr.butter[3], 'beach', 3, 120, 'A big shell that whispers the sea.'],
  ['sand_dollar', 'Sand dollar', 'dollar', Rr.sand[3], Rr.sand[2], 'beach', 2, 70, 'A flat round shell with a flower on top.'],
  ['glass_green', 'Green sea glass', 'glass', Rr.mint[2], Rr.mint[1], 'beach', 1, 30, 'A bottle, softened by the sea for years.'],
  ['glass_blue', 'Blue sea glass', 'glass', Rr.sky[2], Rr.sky[1], 'beach', 2, 50, 'Frosted blue. Hina says blue is the lucky colour.'],
  ['glass_pink', 'Pink sea glass', 'glass', Rr.sakura[2], Rr.sakura[1], 'beach', 4, 200, 'Very rare. Pink like a sakura petal.'],
  ['coral', 'Coral piece', 'coral', Rr.coral[2], Rr.coral[1], 'beach', 2, 60, 'A branch of coral washed up by the waves.'],
  ['message', 'Bottle with a note', 'message', Rr.mint[3], Rr.mint[2], 'beach', 4, 150, 'The note says: whoever finds this, have a lovely day.'],
  ['pearl', 'Pearl', 'pearl', Rr.paper[2], Rr.lilac[3], 'beach', 5, 600, 'Storms sometimes leave treasures on the sand.'],
  ['nautilus', 'Nautilus shell', 'ammonite', Rr.paper[3], Rr.coral[2], 'beach', 5, 700, 'Perfect spiral chambers. A rare find.'],
  ['starfish', 'Starfish', 'starfish', Rr.hairGinger[2], Rr.hairGinger[1], 'cave', 1, 40, 'Found resting in the cave pools.'],
  ['urchin', 'Sea urchin shell', 'urchin', Rr.lilac[1], Rr.lilac[0], 'cave', 2, 55, 'An empty, spiky little dome.'],
  ['abalone', 'Abalone shell', 'scallop', Rr.mint[3], Rr.lilac[3], 'cave', 3, 150, 'Rainbow inside, like oil on water.'],
  ['turban', 'Turban shell', 'conch', Rr.forest[2], Rr.stone[3], 'cave', 2, 50, 'A knobbly shell from the tide pools.'],
];
for (const [k, name, shape, c, c2, where, rarity, price, desc] of SHELLS) {
  const item = 'shell_' + k;
  register('item', item, { name, desc, cat: 'shell', price, icon: itemIcon(shape, { c, c2 }), tags: ['shell', k], rarity });
  register('collectible', item, { item, kind: 'shell', where: [where], rarity, storm: rarity >= 4 });
}
export const MINERALS = [
  ['quartz', 'Quartz', 'crystal', Rr.paper[4], Rr.sky[3], 'cave dig rock', 1, 40, 'Clear crystal points. Hums if you listen hard.'],
  ['amethyst', 'Amethyst', 'crystal', Rr.lilac[2], Rr.lilac[1], 'cave rock', 2, 90, 'Purple crystal from deep in the cave.'],
  ['jade', 'Jade', 'gem', Rr.mint[2], Rr.mint[1], 'rock dig', 3, 160, 'Cool and green. Grandma had a jade bangle.'],
  ['moonstone', 'Moonstone', 'gem', Rr.lilac[3], Rr.sky[3], 'cave rock', 4, 300, 'Glows softly, like the moon behind a cloud.'],
  ['pyrite', 'Pyrite', 'nugget', Rr.butter[2], Rr.butter[1], 'rock dig', 1, 50, 'Fool\'s gold. Still sparkly, though.'],
  ['geode', 'Geode', 'geode', Rr.lilac[2], Rr.lilac[1], 'dig cave', 2, 80, 'Dull outside, a crystal cave inside.'],
  ['obsidian', 'Obsidian', 'gem', Rr.charcoal[2], Rr.charcoal[1], 'rock cave', 2, 70, 'Black volcanic glass, smooth as ice.'],
  ['amber', 'Amber', 'amber', Rr.hairGinger[3], Rr.hairGinger[2], 'dig', 3, 200, 'Old tree sap with a tiny bug inside.'],
  ['ammonite', 'Ammonite', 'ammonite', Rr.sand[2], Rr.sand[1], 'dig cave', 2, 140, 'A spiral sea creature from long, long ago.'],
  ['trilobite', 'Trilobite', 'trilobite', Rr.stone[3], Rr.stone[2], 'dig', 3, 220, 'One of the first animals with eyes.'],
  ['shark_tooth', 'Shark tooth', 'tooth', Rr.paper[2], Rr.stone[3], 'dig', 2, 120, 'Fossil tooth from a giant ancient shark.'],
  ['meteorite', 'Meteorite', 'rock', Rr.charcoal[3], Rr.metal[3], 'dig', 5, 800, 'A piece of a shooting star. Ms. Fujita would love this.'],
];
for (const [k, name, shape, c, c2, where, rarity, price, desc] of MINERALS) {
  const item = 'min_' + k;
  register('item', item, { name, desc, cat: 'mineral', price, icon: itemIcon(shape, { c, c2 }), tags: ['mineral', k], rarity });
  register('collectible', item, { item, kind: 'mineral', where: where.split(' '), rarity });
}

// ================================================================ CROPS (32) + seeds
export const CROPS = [
  // id, name, kind, c, c2, seasons, days, regrow, seed price, sell price, energy (0 = not a snack)
  ['turnip', 'Turnip', 'root', Rr.paper[4], Rr.lilac[2], 'sp', 4, 0, 20, 45, 6],
  ['potato', 'Potato', 'root', Rr.sand[2], Rr.dirt[2], 'sp', 6, 0, 30, 70, 0],
  ['strawberry', 'Strawberry', 'bush', Rr.ribbon[2], Rr.ribbon[1], 'sp', 8, 3, 60, 60, 10],
  ['spinach', 'Spinach', 'leafy', Rr.forest[2], Rr.forest[1], 'sp', 5, 0, 20, 50, 0],
  ['cabbage', 'Cabbage', 'leafy', Rr.forest[4], Rr.forest[3], 'sp', 8, 0, 40, 110, 0],
  ['daikon', 'Daikon', 'root', Rr.paper[4], Rr.paper[2], 'sp au', 7, 0, 30, 85, 0],
  ['tulip', 'Tulip', 'flower', Rr.coral[2], Rr.ribbon[1], 'sp', 6, 0, 25, 60, 0],
  ['pansy', 'Pansy', 'flower', Rr.lilac[2], Rr.butter[2], 'sp', 5, 0, 25, 55, 0],
  ['tomato', 'Tomato', 'vine', Rr.ribbon[2], Rr.ribbon[1], 'su au', 7, 3, 40, 55, 8],
  ['cucumber', 'Cucumber', 'vine', Rr.forest[3], Rr.forest[2], 'su', 6, 3, 30, 45, 6],
  ['corn', 'Corn', 'tall', Rr.butter[2], Rr.forest[3], 'su au', 10, 4, 50, 70, 0],
  ['eggplant', 'Eggplant', 'vine', Rr.lilac[1], Rr.lilac[0], 'su', 7, 3, 40, 50, 0],
  ['watermelon', 'Watermelon', 'melon', Rr.forest[2], Rr.coral[2], 'su', 11, 0, 80, 250, 20],
  ['pepper', 'Green pepper', 'vine', Rr.forest[3], Rr.forest[1], 'su', 6, 3, 30, 40, 0],
  ['sunflower', 'Sunflower', 'tall', Rr.butter[2], Rr.wood[1], 'su', 8, 0, 40, 90, 0],
  ['morning_glory', 'Morning glory', 'flower', Rr.sky[2], Rr.lilac[2], 'su', 6, 0, 30, 70, 0],
  ['pumpkin', 'Pumpkin', 'melon', Rr.hairGinger[2], Rr.hairGinger[1], 'au', 12, 0, 80, 260, 0],
  ['sweet_potato', 'Sweet potato', 'root', Rr.lilac[1], Rr.coral[1], 'au', 8, 0, 40, 95, 0],
  ['carrot', 'Carrot', 'root', Rr.hairGinger[2], Rr.hairGinger[1], 'au sp', 5, 0, 25, 55, 6],
  ['negi', 'Green onion', 'leafy', Rr.forest[3], Rr.paper[4], 'au wi', 5, 0, 20, 45, 0],
  ['edamame', 'Edamame', 'vine', Rr.forest[3], Rr.forest[2], 'au', 7, 3, 35, 45, 0],
  ['bok_choy', 'Bok choy', 'leafy', Rr.forest[3], Rr.paper[4], 'au', 5, 0, 25, 60, 0],
  ['cosmos', 'Cosmos', 'flower', Rr.sakura[2], Rr.sakura[1], 'au', 6, 0, 30, 70, 0],
  ['chrysanthemum', 'Chrysanthemum', 'flower', Rr.butter[2], Rr.butter[1], 'au', 8, 0, 40, 100, 0],
  ['komatsuna', 'Komatsuna', 'leafy', Rr.forest[2], Rr.forest[1], 'wi', 5, 0, 25, 60, 0],
  ['broccoli', 'Broccoli', 'head', Rr.forest[2], Rr.forest[1], 'wi', 8, 0, 40, 110, 0],
  ['snow_pea', 'Snow pea', 'vine', Rr.forest[4], Rr.forest[3], 'wi sp', 6, 3, 30, 40, 0],
  ['mizuna', 'Mizuna', 'leafy', Rr.forest[4], Rr.forest[2], 'wi', 4, 0, 20, 45, 0],
  ['kale', 'Kale', 'leafy', Rr.forest[1], Rr.forest[0], 'wi', 6, 0, 30, 70, 0],
  ['yuzu', 'Yuzu', 'bush', Rr.butter[2], Rr.butter[1], 'wi au', 10, 4, 70, 80, 0],
  ['camellia', 'Camellia', 'flower', Rr.ribbon[2], Rr.ribbon[1], 'wi', 7, 0, 40, 90, 0],
  ['snowdrop', 'Snowdrop', 'flower', Rr.paper[4], Rr.mint[3], 'wi', 5, 0, 30, 70, 0],
];
const CROP_ICON = { root: 'root', leafy: 'leafy', bush: 'berry', vine: 'fruit', tall: 'fruit', melon: 'fruit', flower: 'flower', head: 'leafy' };
const LEAFY = ['spinach', 'cabbage', 'bok_choy', 'komatsuna', 'mizuna', 'kale', 'negi'];
const FRUIT = ['strawberry', 'watermelon', 'yuzu', 'tomato'];
for (const [k, name, kind, c, c2, se, days, regrow, seedPrice, price, energy] of CROPS) {
  const flower = kind === 'flower' || k === 'sunflower', item = 'crop_' + k, seed = 'seed_' + k, ss = seasons(se);
  const tags = flower ? ['flower', 'gift', k] : ['veg', 'vegetable', k, ...(LEAFY.includes(k) ? ['leafy'] : []), ...(FRUIT.includes(k) ? ['fruit'] : []), ...(k === 'yuzu' ? ['citrus'] : [])];
  register('item', item, { name, desc: flower ? `Fresh ${name.toLowerCase()} from the garden. A lovely gift.` : `Home-grown ${name.toLowerCase()}. Ready for the kitchen.`, cat: 'crop', price, icon: itemIcon(k === 'sunflower' ? 'flower' : CROP_ICON[kind], { c: k === 'sunflower' ? Rr.butter[2] : c, c2, c3: flower ? Rr.butter[3] : undefined }), tags, seasons: ss, ...(energy ? { energy, mood: 3 } : {}) });
  register('item', seed, { name: `${name} seeds`, desc: `Grows in ${ss.join(' and ')} in ${days} days${regrow ? `, then every ${regrow} days` : ''}. Use to choose them for planting.`, cat: 'seed', price: Math.round(seedPrice / 2), buy: seedPrice, icon: itemIcon('seed', { c }), tags: ['seed'], seasons: ss, crop: item, useLabel: 'Plant these next', use: (g) => { HS(g).seed = seed; g.toast(`Ready to plant ${name.toLowerCase()}`, get('item', seed).icon); return true; } });
  register('crop', item, { seed, item, name, seasons: ss, days, regrow: regrow || 0, kind, flower, c, c2 });
}
register('item', 'crop_giant_pumpkin', { name: 'Giant pumpkin', desc: 'An enormous pumpkin. Mr. Hayashi will be jealous.', cat: 'crop', price: 900, icon: itemIcon('fruit', { c: Rr.hairGinger[3], c2: Rr.hairGinger[1] }), tags: ['veg', 'pumpkin', 'giant'] });
register('item', 'crop_giant_tomato', { name: 'Giant tomato', desc: 'A tomato the size of a football. Mr. Ogawa would cheer.', cat: 'crop', price: 400, icon: itemIcon('fruit', { c: Rr.ribbon[3], c2: Rr.ribbon[1] }), tags: ['veg', 'tomato', 'giant'] });

// ================================================================ CONSTELLATIONS (24)
// stars in a 100x60 box; path = star indices in drawing order, -1 lifts the pen.
export const STARS = [
  ['leo', 'Leo', 'spring', '10,30 20,20 30,15 40,20 38,30 30,34 60,32 85,38 90,50 62,46', [0, 1, 2, 3, 4, 5, 0, -1, 4, 6, 7, 8, 9, 6], 'A proud lion resting on the spring sky.'],
  ['virgo', 'Virgo', 'spring', '15,20 30,25 45,22 55,30 70,26 50,42 40,55 80,45', [0, 1, 2, 3, 4, -1, 3, 5, 6, -1, 5, 7], 'Holds a single bright star, Spica, like a grain of wheat.'],
  ['big_dipper', 'Big Dipper', 'spring', '10,15 25,12 38,18 50,22 52,38 70,42 72,26', [0, 1, 2, 3, 4, 5, 6, 3], 'The great ladle. Follow its edge to find the North Star.'],
  ['bootes', 'Bootes', 'spring', '50,55 40,40 35,22 45,8 58,18 60,38', [0, 1, 2, 3, 4, 5, 0], 'The herdsman, shaped like a kite in the sky.'],
  ['cancer', 'Cancer', 'spring', '50,30 50,15 35,48 68,50 45,42', [1, 0, 2, -1, 0, 3, -1, 0, 4], 'A shy crab, faint and easy to miss.'],
  ['corona', 'Northern crown', 'spring', '15,30 25,40 38,46 50,48 62,45 74,38 84,28', [0, 1, 2, 3, 4, 5, 6], 'A little arc of jewels. A crown left for someone.'],
  ['lyra', 'Lyra', 'summer', '50,10 40,25 60,25 42,48 58,50', [0, 1, 2, 0, -1, 1, 3, 4, 2], 'A harp. Its star Vega is the weaver princess.'],
  ['cygnus', 'Cygnus', 'summer', '50,5 50,25 50,40 50,55 25,22 75,28 15,30 85,36', [0, 1, 2, 3, -1, 6, 4, 1, 5, 7], 'A swan flying down the Milky Way.'],
  ['aquila', 'Aquila', 'summer', '50,25 42,22 58,28 20,40 80,15 50,52', [3, 1, 0, 2, 4, -1, 0, 5], 'An eagle. Its bright star Altair is the herd boy.'],
  ['scorpius', 'Scorpius', 'summer', '20,10 25,20 30,30 40,38 52,45 64,52 76,50 84,40 80,30', [0, 1, 2, 3, 4, 5, 6, 7, 8], 'A scorpion with a red heart, Antares.'],
  ['sagittarius', 'Sagittarius', 'summer', '20,40 35,30 50,30 60,40 45,50 30,52 50,15', [0, 1, 2, 3, 4, 5, 0, -1, 1, 6, 2], 'The teapot! Steam from its spout is the Milky Way.'],
  ['hercules', 'Hercules', 'summer', '35,20 60,18 62,38 38,40 20,8 80,5 85,55 15,55', [0, 1, 2, 3, 0, -1, 0, 4, -1, 1, 5, -1, 2, 6, -1, 3, 7], 'A strong hero, upside down for some reason.'],
  ['pegasus', 'Pegasus', 'autumn', '20,20 55,20 55,50 20,50 75,12 90,25 80,55', [0, 1, 2, 3, 0, -1, 1, 4, 5, -1, 2, 6], 'The great square of autumn, a winged horse.'],
  ['andromeda', 'Andromeda', 'autumn', '10,50 30,40 50,32 70,22 90,12 52,48 72,40', [0, 1, 2, 3, 4, -1, 1, 5, 6], 'A princess chained to the sky, waiting for rescue.'],
  ['cassiopeia', 'Cassiopeia', 'autumn', '10,15 28,40 48,22 68,42 88,18', [0, 1, 2, 3, 4], 'A big W. A queen in her chair.'],
  ['pisces', 'Pisces', 'autumn', '10,15 20,30 32,45 50,55 70,45 85,38 92,28 80,24', [0, 1, 2, 3, 4, 5, 6, 7, 5], 'Two fish tied together so they never lose each other.'],
  ['aries', 'Aries', 'autumn', '20,30 45,22 65,25 75,35', [0, 1, 2, 3], 'A small ram with a golden fleece.'],
  ['capricornus', 'Capricornus', 'autumn', '15,20 30,40 55,52 80,38 88,15 50,25', [0, 1, 2, 3, 4, 5, 0], 'A sea goat: half goat, half fish.'],
  ['orion', 'Orion', 'winter', '30,10 70,12 42,32 50,33 58,34 28,55 72,52', [0, 2, 3, 4, 1, -1, 2, 5, -1, 4, 6, -1, 0, 1], 'The hunter with his famous three-star belt.'],
  ['taurus', 'Taurus', 'winter', '50,40 40,30 60,30 20,12 80,10 45,48 70,52', [3, 1, 0, 2, 4, -1, 0, 5, -1, 0, 6], 'A bull with the red eye Aldebaran and the Pleiades.'],
  ['gemini', 'Gemini', 'winter', '30,10 55,8 28,50 52,52 33,30 53,30', [0, 4, 2, -1, 1, 5, 3, -1, 4, 5], 'The twins, side by side all winter.'],
  ['canis_major', 'Canis Major', 'winter', '40,15 55,22 50,38 30,50 70,52 62,30', [0, 1, 5, 2, 3, -1, 2, 4], 'The big dog, wearing Sirius, the brightest star.'],
  ['auriga', 'Auriga', 'winter', '50,8 25,22 30,48 65,52 75,25', [0, 1, 2, 3, 4, 0], 'The charioteer, a pentagon of stars.'],
  ['perseus', 'Perseus', 'winter', '50,10 45,25 48,40 30,55 65,55 70,30', [0, 1, 2, 3, -1, 2, 4, -1, 1, 5], 'A hero on his way to save Andromeda.'],
];
for (const [id, name, season, pts, path, lore] of STARS) register('constellation', id, { name, season, stars: pts.split(' ').map((p) => p.split(',').map(Number)), path, lore });
register('item', 'gift_star_sketch', { name: 'Star sketch', desc: 'A little drawing of a constellation, done at the telescope.', cat: 'gift', price: 40, icon: itemIcon('paper', { c: Rr.navy[2] }), tags: ['gift', 'art', 'stars'] });

// ================================================================ DISHES & RECIPES (60)
// tokens: 'rice' -> ing_rice (or tag:rice when it's also a crop), 'fish_x' / 'dish_x' / 'tag:x' as is, 'x*2' for two.
const CROP_IDS = new Set(CROPS.map((c) => c[0]));
const ingr = (s) => Object.fromEntries(s.split(' ').map((t) => {
  const [k, n] = t.split('*'), id = k.includes(':') || /^(fish|dish|drink|crop|shell|bug|min|mat)_/.test(k) ? k : CROP_IDS.has(k) || k === 'citrus' ? 'tag:' + k : needItem('ing_' + k, { cat: 'food', tags: ['ingredient'] });
  return [id, +(n || 1)];
}));
export const DISHES = [
  // id, name, shape, colour, ingredients, energy, mood, buff (id:minutes), source, time, price, desc
  ['dish_onigiri', 'Onigiri', 'onigiri', Rr.charcoal[1], 'rice nori', 30, 3, '', 'start', 10, 60, 'A rice ball wrapped in nori. The perfect snack.'],
  ['dish_miso_soup', 'Miso soup', 'bowl', Rr.wood[3], 'miso tofu', 25, 5, 'focus:180', 'start', 15, 70, 'Warm and comforting. Helps you focus on studying.'],
  ['dish_tamagoyaki', 'Tamagoyaki', 'sweet', Rr.butter[2], 'egg*2 sugar', 30, 4, '', 'start', 15, 80, 'A sweet rolled omelette, like Grandma makes.'],
  ['drink_green_tea', 'Green tea', 'cup', Rr.forest[3], 'tea', 10, 6, 'calm:120', 'start', 5, 40, 'A cup of green tea. Steady hands, calm heart.'],
  ['dish_grilled_fish', 'Grilled fish', 'fishplate', Rr.wood[3], 'tag:fish', 40, 4, '', 'start', 20, 0, 'Any fish, simply grilled with salt.'],
  ['dish_butter_toast', 'Butter toast', 'bread', Rr.wood[4], 'bread butter', 25, 3, '', 1, 5, 60, 'Golden toast with melting butter.'],
  ['dish_pancakes', 'Fluffy pancakes', 'pancake', Rr.wood[3], 'flour egg milk', 45, 8, '', 'mika', 20, 160, 'A wobbly stack, Cafe Kumo style.'],
  ['dish_omelette', 'Veggie omelette', 'sweet', Rr.butter[2], 'egg*2 spinach', 45, 5, 'green:120', 1, 15, 150, 'Fluffy eggs with garden spinach.'],
  ['dish_okayu', 'Okayu', 'bowl', Rr.paper[4], 'rice negi', 35, 6, 'cozy:120', 2, 20, 110, 'Soft rice porridge. Good for rainy days.'],
  ['dish_french_toast', 'French toast', 'bread', Rr.butter[3], 'bread egg milk', 50, 8, '', 3, 15, 180, 'Soft, sweet and dusted with sugar.'],
  ['drink_strawberry_milk', 'Strawberry milk', 'glassdrink', Rr.sakura[2], 'strawberry milk', 20, 8, 'swift:90', 1, 5, 120, 'Pink, sweet and fresh from the garden.'],
  ['dish_grilled_mackerel', 'Grilled mackerel', 'fishplate', Rr.mint[1], 'fish_mackerel soy', 60, 6, 'lucky:120', 'jun', 20, 260, 'Captain Jun\'s favourite. Crispy skin, soy glaze.'],
  ['dish_bento', 'Home bento', 'bento', Rr.butter[2], 'rice dish_tamagoyaki tomato', 80, 10, 'chef:180', 4, 25, 380, 'A packed lunch with everything in its place.'],
  ['dish_sandwich', 'Egg sandwich', 'sandwich', Rr.butter[3], 'bread egg cucumber', 45, 5, '', 2, 10, 170, 'Soft bread, egg salad and crunchy cucumber.'],
  ['dish_yakisoba', 'Yakisoba', 'noodles', Rr.wood[2], 'noodles cabbage chicken', 65, 8, '', 3, 20, 260, 'Fried noodles, festival style.'],
  ['dish_udon', 'Kake udon', 'noodles', Rr.paper[3], 'noodles dashi negi', 55, 7, 'cozy:120', 'dad', 20, 220, 'Thick noodles in a light broth. Dad\'s recipe.'],
  ['dish_curry_rice', 'Curry rice', 'curry', Rr.wood[2], 'rice curry potato carrot', 90, 10, 'chef:180', 4, 40, 420, 'Thick, mild curry. Even Mochi asks for some.'],
  ['dish_ramen', 'Ramen', 'noodles', Rr.butter[3], 'noodles egg chicken negi', 85, 10, '', 6, 40, 420, 'A big steaming bowl with a soft egg on top.'],
  ['dish_fried_rice', 'Fried rice', 'curry', Rr.butter[2], 'rice egg negi', 55, 6, '', 3, 15, 220, 'Quick, golden and full of flavour.'],
  ['dish_hiyashi_chuka', 'Cold noodles', 'noodles', Rr.butter[2], 'noodles cucumber tomato', 55, 9, 'swift:120', 'dad', 15, 260, 'Chilled noodles for hot summer days.'],
  ['dish_tempura', 'Tempura', 'curry', Rr.butter[3], 'fish_whiting flour sweet_potato', 70, 9, '', 'hina', 30, 360, 'Light, crispy batter. Hina\'s family recipe.'],
  ['dish_sashimi', 'Sea bream sashimi', 'fishplate', Rr.coral[3], 'fish_sea_bream soy', 60, 12, 'lucky:180', 6, 15, 520, 'Delicate slices of red sea bream.'],
  ['dish_nikujaga', 'Nikujaga', 'bowl', Rr.wood[2], 'chicken potato carrot onion', 80, 10, '', 'goro', 40, 400, 'A homestyle stew. Mr. Hayashi\'s late wife\'s recipe.'],
  ['dish_oden', 'Oden', 'pot', Rr.wood[3], 'tofu daikon egg dashi', 80, 12, 'cozy:180', 5, 50, 420, 'A winter hotpot of simmered treats.'],
  ['dish_nabe', 'Hotpot', 'pot', Rr.coral[2], 'bok_choy tofu chicken mushroom', 90, 12, 'cozy:180', 'dad', 45, 460, 'A bubbling pot to share on a cold night.'],
  ['dish_karaage', 'Karaage', 'curry', Rr.hairGinger[2], 'chicken flour ginger', 65, 8, '', 'kai', 25, 300, 'Crispy fried chicken. Kai can eat twenty.'],
  ['dish_takoyaki', 'Takoyaki', 'dango', Rr.wood[3], 'fish_octopus flour egg', 70, 10, 'crafty:120', 7, 30, 420, 'Little octopus balls, hot and gooey.'],
  ['dish_okonomiyaki', 'Okonomiyaki', 'pie', Rr.wood[2], 'flour cabbage egg', 70, 9, 'crafty:120', 4, 25, 320, 'A savoury pancake, cooked how you like it.'],
  ['dish_cream_stew', 'Cream stew', 'pot', Rr.paper[4], 'milk potato carrot chicken', 85, 11, 'cozy:180', 'dad', 45, 430, 'Creamy, warm and soft. Dad\'s winter classic.'],
  ['dish_pumpkin_soup', 'Pumpkin soup', 'bowl', Rr.hairGinger[2], 'pumpkin milk', 55, 8, '', 3, 30, 380, 'Smooth and golden, like autumn in a bowl.'],
  ['dish_squid_skewer', 'Grilled squid', 'skewer', Rr.paper[3], 'fish_squid soy', 50, 7, '', 5, 15, 280, 'A festival snack on a stick.'],
  ['dish_unadon', 'Eel rice bowl', 'curry', Rr.woodDark[3], 'fish_eel rice soy', 100, 12, 'lucky:240', 8, 40, 620, 'Glazed eel over rice. A summer treat.'],
  ['dish_stir_fry', 'Veggie stir-fry', 'curry', Rr.forest[3], 'tag:veg*2 soy', 50, 6, 'green:120', 'hidden', 15, 200, 'Whatever the garden gave you, fried with soy.'],
  ['dish_garden_salad', 'Garden salad', 'bowl', Rr.forest[3], 'tag:leafy*2', 35, 6, 'green:180', 'hidden', 10, 170, 'Crisp leaves picked this morning.'],
  ['dish_pickles', 'Pickles', 'bowl', Rr.forest[2], 'cucumber*2 salt', 20, 5, '', 'hidden', 10, 140, 'Salty, crunchy and Grandma-approved.'],
  ['dish_tomato_noodles', 'Tomato noodles', 'noodles', Rr.ribbon[2], 'noodles tomato eggplant', 60, 8, '', 6, 25, 300, 'A summery noodle dish with garden veg.'],
  ['dish_baked_sweet_potato', 'Baked sweet potato', 'root', Rr.lilac[1], 'sweet_potato', 40, 9, 'cozy:120', 'hidden', 30, 200, 'Yaki-imo! Warm hands on a cold day.'],
  ['dish_corn_soup', 'Corn soup', 'bowl', Rr.butter[2], 'corn milk', 45, 8, '', 'hidden', 25, 240, 'Sweet and creamy corn potage.'],
  ['dish_grilled_corn', 'Grilled corn', 'skewer', Rr.butter[2], 'corn soy', 40, 7, '', 'hidden', 15, 200, 'Charred with soy, festival style.'],
  ['dish_edamame', 'Salted edamame', 'bowl', Rr.forest[3], 'edamame salt', 25, 6, 'green:90', 'hidden', 10, 140, 'Pop, pop, pop. Impossible to stop.'],
  ['dish_broccoli_gratin', 'Broccoli gratin', 'pie', Rr.butter[3], 'broccoli cheese milk', 75, 10, 'focus:180', 7, 35, 420, 'Bubbling cheese over winter broccoli.'],
  ['dish_dango', 'Mitarashi dango', 'dango', Rr.wood[3], 'mochiko sugar soy', 40, 10, '', 'hana', 25, 220, 'Grandma Hana\'s sweet-salty rice dumplings.'],
  ['dish_ichigo_daifuku', 'Strawberry daifuku', 'mochi', Rr.paper[4], 'mochiko red_bean strawberry', 45, 14, '', 5, 25, 330, 'A whole strawberry hiding in soft mochi.'],
  ['dish_starlight_mochi', 'Starlight mochi', 'mochi', Rr.lilac[3], 'mochiko citrus sugar', 60, 25, 'lucky:240', 'story', 40, 800, 'Glowing mochi with yuzu, made on a moonlit evening.'],
  ['dish_dorayaki', 'Dorayaki', 'pancake', Rr.wood[2], 'flour egg red_bean', 50, 10, '', 4, 20, 240, 'Two little pancakes hugging sweet bean paste.'],
  ['dish_taiyaki', 'Taiyaki', 'fish', Rr.wood[3], 'flour red_bean milk', 50, 10, '', 'dad', 20, 240, 'A fish-shaped cake. Dad says the tail is the best bit.'],
  ['dish_strawberry_shortcake', 'Strawberry shortcake', 'cake', Rr.ribbon[2], 'flour egg strawberry cream', 70, 18, '', 8, 45, 520, 'Fluffy sponge, cream and strawberries.'],
  ['dish_watermelon_ice', 'Watermelon ice', 'sweet', Rr.coral[2], 'watermelon sugar', 35, 12, 'swift:120', 'hidden', 15, 260, 'A frosty bar for the hottest days.'],
  ['dish_pumpkin_pudding', 'Pumpkin pudding', 'pudding', Rr.hairGinger[2], 'pumpkin egg milk sugar', 60, 14, '', 6, 40, 460, 'Wobbly, caramel-topped and autumn-sweet.'],
  ['dish_cookies', 'Honey cookies', 'cookie', Rr.wood[3], 'flour butter honey', 40, 12, 'cozy:120', 'suzu', 30, 260, 'Suzu bakes these for writing marathons.'],
  ['dish_chocolate_cake', 'Chocolate cake', 'cake', Rr.woodDark[2], 'flour chocolate egg', 70, 18, '', 9, 50, 560, 'Rich, dark and dangerously good.'],
  ['dish_apple_pie', 'Apple pie', 'pie', Rr.butter[2], 'apple flour butter', 70, 14, '', 7, 50, 480, 'Warm from the oven, cinnamon optional.'],
  ['dish_sweet_potato_cake', 'Sweet potato cake', 'sweet', Rr.butter[2], 'sweet_potato butter sugar', 55, 12, '', 'book', 35, 340, 'Golden little cakes from the cookbook.'],
  ['drink_matcha_latte', 'Matcha latte', 'mug', Rr.mint[2], 'matcha milk', 25, 10, 'focus:120', 'book', 10, 180, 'Green, creamy and gently energising.'],
  ['drink_yuzu_tea', 'Yuzu tea', 'mug', Rr.butter[2], 'citrus honey', 20, 12, 'cozy:180', 2, 10, 160, 'Hot citrus and honey for winter evenings.'],
  ['drink_hot_cocoa', 'Hot cocoa', 'mug', Rr.woodDark[2], 'chocolate milk', 25, 14, 'cozy:180', 'theo', 10, 170, 'Theo\'s secret: a pinch of salt.'],
  ['drink_lemonade', 'Lemonade', 'glassdrink', Rr.butter[3], 'lemon sugar', 20, 9, 'swift:90', 1, 5, 120, 'Sharp, sweet and very cold.'],
  ['drink_tomato_juice', 'Tomato juice', 'glassdrink', Rr.ribbon[2], 'tomato*2', 25, 6, 'swift:120', 'hidden', 5, 160, 'Fresh-pressed garden tomatoes.'],
  ['drink_petal_tea', 'Petal tea', 'cup', Rr.sakura[2], 'tag:flower tea', 15, 14, 'calm:180', 'hidden', 10, 180, 'Flower petals steeped in green tea.'],
  ['dish_sakura_mochi', 'Sakura mochi', 'mochi', Rr.sakura[2], 'mochiko red_bean tag:flower', 45, 14, '', 'book', 25, 320, 'Pink mochi wrapped in a pickled leaf.'],
];
register('item', 'dish_mysterious_lump', { name: 'Mysterious lump', desc: 'An experiment gone a little wrong. Edible. Probably.', cat: 'food', price: 5, energy: 8, mood: -1, icon: itemIcon('lump', { c: Rr.lilac[1] }), tags: ['dish', 'trash'] });
const NPC_RECIPE = {};
for (const [id, name, shape, c, ing, energy, mood, buff, from, time, price, desc] of DISHES) {
  const drink = id.startsWith('drink_'), [bid, bmin] = buff ? buff.split(':') : [];
  const sweet = ['dango', 'mochi', 'cake', 'pudding', 'cookie', 'sweet', 'pancake'].includes(shape) || /sweet|shortcake|cocoa|milk/.test(id);
  register('item', id, { name, desc, cat: 'food', price: price || Math.round(energy * 4), energy, mood, icon: itemIcon(shape, { c }), tags: ['dish', ...(drink ? ['drink'] : []), ...(sweet ? ['sweet', 'dessert'] : []), ...(id === 'dish_starlight_mochi' ? ['universalLove'] : [])], buff: bid ? { id: bid, min: +bmin } : null });
  const steps = drink ? ['stir', 'fry'] : sweet ? ['stir', 'chop', 'fry'] : ['chop', 'stir', 'fry'];
  if (/sashimi|salad|pickles|tomato_juice/.test(id)) steps.splice(0, steps.length, 'chop', 'chop', 'stir');
  register('recipe', id, { name, ingredients: ingr(ing), out: id, time, steps, station: 'kitchen', learned: from === 'start', skill: typeof from === 'number' ? from : null, from: typeof from === 'string' ? from : null, hidden: from === 'hidden', story: from === 'story' });
  if (typeof from === 'string' && get('npc', from)) NPC_RECIPE[from] = id;
}
export { NPC_RECIPE };

// ================================================================ CRAFTS (18), workbench in the yard shed
const mat = (id) => needItem(id, { cat: 'material', tags: ['material'] });
['mat_wood', 'mat_cloth', 'mat_string', 'mat_paper', 'mat_glass', 'mat_wire', 'mat_ink', 'mat_yarn', 'mat_beads', 'mat_clay'].forEach(mat);
needItem('mat_fertiliser', { cat: 'material', tags: ['garden'] });
const own = (id, name, cat, shape, c, price, desc, tags = []) => { if (!get('item', id)) register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c }), tags: [cat, ...tags] }); return id; };
own('gift_friendship_bracelet', 'Friendship bracelet', 'gift', 'toy', Rr.coral[2], 120, 'Three colours of thread, braided with care.', ['handmade', 'universalLike']);
own('gift_shell_necklace', 'Shell necklace', 'gift', 'shell', Rr.sakura[3], 180, 'Tiny shells on a string. Smells a bit like the sea.', ['handmade', 'beach']);
own('gift_paper_crane', 'Paper crane', 'gift', 'paper', Rr.coral[3], 60, 'Folded with a wish inside.', ['handmade', 'origami']);
own('gift_star_jar', 'Jar of paper stars', 'gift', 'bottle', Rr.butter[3], 220, 'Dozens of tiny folded stars in a jar.', ['handmade', 'origami', 'stars']);
own('gift_knit_scarf', 'Knitted scarf', 'gift', 'shirt', Rr.lilac[2], 260, 'A cozy scarf. Only slightly wonky.', ['handmade', 'clothes']);
own('furn_shell_lamp', 'Shell lamp', 'decor', 'furniture', Rr.sand[3], 400, 'A lamp covered in beach shells. Glows like the shore at sunset.', ['beach']);
own('furn_fish_print', 'Fish print', 'decor', 'paper', Rr.navy[2], 260, 'Gyotaku: an ink print of a real fish you caught.', ['art']);
own('furn_terrarium', 'Bug terrarium', 'decor', 'box', Rr.mint[2], 360, 'A little glass world with moss and a twig.', ['nature']);
own('furn_star_mobile', 'Star mobile', 'decor', 'star', Rr.butter[2], 300, 'Paper stars that turn slowly over the bed.', ['stars']);
own('furn_scarecrow', 'Scarecrow', 'decor', 'toy', Rr.wood[3], 320, 'Wears an old straw hat. Guards the garden.', ['garden']);
own('furn_flower_vase', 'Flower vase', 'decor', 'plant', Rr.sky[2], 220, 'Clay vase with fresh garden flowers.', ['garden']);
export const CRAFTS = [
  // id (out), ingredients, crafting level, extra { n }
  ['gift_bouquet', 'tag:flower*3 mat_string', 0],
  ['gift_pressed_flower', 'tag:flower mat_paper', 0],
  ['gift_paper_crane', 'mat_paper*2', 0],
  ['gift_friendship_bracelet', 'mat_string*2 mat_beads', 0],
  ['gift_shell_necklace', 'tag:shell*3 mat_string', 1],
  ['gift_postcard', 'mat_paper mat_ink', 1],
  ['mat_fertiliser', 'tag:veg*2', 1, { n: 2, name: 'Compost' }],
  ['gift_wind_chime', 'tag:shell*2 mat_string mat_glass', 2],
  ['gift_star_jar', 'mat_paper*3 mat_glass', 2],
  ['gift_candle', 'honey mat_string', 2],
  ['furn_flower_vase', 'mat_clay*2 tag:flower*2', 3],
  ['gift_knit_scarf', 'mat_yarn*3', 3],
  ['furn_fish_print', 'tag:fish mat_paper mat_ink', 3],
  ['gift_photo_frame', 'mat_wood*2 mat_glass', 4],
  ['furn_star_mobile', 'mat_wire mat_paper*2 tag:mineral', 4],
  ['furn_terrarium', 'mat_glass*2 mat_wood tag:leafy', 5],
  ['furn_scarecrow', 'mat_wood*3 mat_cloth*2', 5],
  ['furn_shell_lamp', 'tag:shell*3 mat_wire mat_glass', 6],
  ['tool_net_2', 'mat_cloth*2 mat_wood mat_wire*2', 6],
];
const cIngr = (s) => Object.fromEntries(s.split(' ').map((t) => { const [k, n] = t.split('*'); return [k.includes('_') || k.includes(':') ? k : needItem('ing_' + k, { cat: 'food', tags: ['ingredient'] }), +(n || 1)]; }));
for (const [out, ing, skill, extra = {}] of CRAFTS) {
  for (const k of Object.keys(cIngr(ing))) if (k.startsWith('mat_')) mat(k);
  if (!get('item', out)) needItem(out, { cat: out.startsWith('tool') ? 'tool' : 'gift' });
  register('craft', 'craft_' + out, { name: extra.name || get('item', out).name, ingredients: cIngr(ing), out, n: extra.n || 1, skill });
}

// ---------------------------------------------------------------- ingredient matching (shared by cooking and crafting)
export function matches(itemId, key) {
  if (!key.startsWith('tag:')) return itemId === key;
  const t = key.slice(4), it = get('item', itemId);
  if (!it) return false;
  if (itemId === 'ing_' + t || itemId === 'crop_' + t) return true;
  if (t === 'citrus' && (itemId === 'ing_lemon' || itemId === 'ing_yuzu')) return true;
  if (t === 'veg' && it.cat === 'crop' && !(it.tags || []).includes('flower')) return true;
  return (it.tags || []).includes(t);
}
// How many of an ingredient key the bag holds, and which item ids would be used (cheapest first).
export function holding(game, key, inv = game.state.inv) {
  if (!key.startsWith('tag:')) return { n: inv[key] || 0, ids: inv[key] ? [key] : [] };
  const ids = Object.keys(inv).filter((id) => inv[id] > 0 && matches(id, key)).sort((a, b) => (get('item', a).price || 0) - (get('item', b).price || 0));
  return { n: ids.reduce((a, id) => a + inv[id], 0), ids };
}
export const canMake = (game, ingredients, times = 1) => Object.entries(ingredients).every(([k, n]) => holding(game, k).n >= n * times);
export function consume(game, ingredients) {
  const used = [];
  for (const [k, n] of Object.entries(ingredients)) {
    let left = n;
    for (const id of holding(game, k).ids) { const take = Math.min(left, game.count(id)); if (take > 0) { game.take(id, take); used.push(id); left -= take; } if (!left) break; }
  }
  return used;
}
export const ingName = (k) => (k.startsWith('tag:') ? { veg: 'Any vegetable', fish: 'Any fish', flower: 'Any flower', shell: 'Any shell', leafy: 'Any leafy green', mineral: 'Any mineral', citrus: 'Yuzu or lemon' }[k.slice(4)] || (get('item', 'crop_' + k.slice(4)) || get('item', 'ing_' + k.slice(4)) || { name: k.slice(4) }).name : (get('item', k) || { name: k }).name);
export const ingIcon = (k) => { if (!k.startsWith('tag:')) return (get('item', k) || {}).icon; const t = k.slice(4); const it = get('item', 'crop_' + t) || get('item', 'ing_' + t) || all('item').find((i) => (i.tags || []).includes(t)); return it && it.icon; };

// ---------------------------------------------------------------- odds and ends other areas name in gift lists
// (junk catches, shop snacks and joke gifts; not part of any museum collection)
const ODD = [
  ['fish_sea_slug', 'Sea slug', 'misc', 'eel', Rr.lilac[2], 5, 'Squishy. Came up on the line by mistake.', ['junk']],
  ['crop_seaweed', 'Seaweed', 'crop', 'leafy', Rr.forest[1], 15, 'A tangle of seaweed from the sea. Good in soup.', ['veg', 'seaweed', 'junk']],
  ['fish_raw', 'Raw fish scraps', 'misc', 'fish2', Rr.coral[3], 5, 'Fish trimmings. Mochi thinks they are treasure.', ['junk']],
  ['fish_raw_squid', 'Raw squid', 'misc', 'squid', Rr.paper[3], 30, 'Slippery, cold and staring at you.', ['junk']],
  ['bug_cockroach', 'Cockroach', 'misc', 'beetle', Rr.woodDark[3], 1, 'Nobody wants this. Nobody.', ['trash']],
  ['bug_frog', 'Little frog', 'misc', 'toy', Rr.forest[3], 20, 'Not a bug. Hopped into the net anyway.', ['junk']],
  ['min_stone', 'Plain stone', 'misc', 'rock', Rr.stone[3], 1, 'Just a stone. Nicely round, though.', ['junk']],
  ['crop_bitter_melon', 'Bitter melon', 'crop', 'fruit', Rr.forest[2], 40, 'Goya. Very healthy, very bitter.', ['veg', 'bitter_melon']],
  ['crop_lettuce', 'Lettuce', 'crop', 'leafy', Rr.forest[4], 30, 'Crisp and plain.', ['veg', 'leafy', 'lettuce']],
  ['crop_garlic', 'Garlic', 'crop', 'root', Rr.paper[4], 30, 'Strong enough to scare off ghosts.', ['veg', 'garlic']],
  ['crop_celery', 'Celery', 'crop', 'leafy', Rr.mint[2], 30, 'Crunchy and stringy.', ['veg', 'celery']],
  ['dish_natto', 'Natto', 'food', 'bowl', Rr.wood[2], 20, 'Sticky fermented beans. You love it or you don\'t.', ['dish']],
  ['dish_boiled_egg', 'Boiled egg', 'food', 'sweet', Rr.paper[4], 15, 'A plain boiled egg.', ['dish']],
  ['drink_decaf', 'Decaf coffee', 'food', 'mug', Rr.woodDark[3], 20, 'Coffee without the point of coffee.', ['dish', 'drink']],
  ['dish_frozen_pizza', 'Frozen pizza', 'food', 'pie', Rr.ribbon[2], 40, 'Fast, cheesy, and a little sad.', ['dish']],
  ['dish_marmalade_toast', 'Marmalade toast', 'food', 'bread', Rr.hairGinger[2], 50, 'Toast with bittersweet orange marmalade.', ['dish']],
  ['dish_instant_noodles', 'Instant noodles', 'food', 'noodles', Rr.butter[2], 30, 'Three minutes to dinner.', ['dish']],
  ['dish_canned_tuna', 'Canned tuna', 'food', 'box', Rr.sky[2], 25, 'A tin of tuna. Mochi hears it open from anywhere.', ['dish']],
  ['dish_canned_corn', 'Canned corn', 'food', 'box', Rr.butter[2], 20, 'Sweetcorn in a tin.', ['dish']],
];
for (const [id, name, cat, shape, c, price, desc, tags] of ODD) if (!get('item', id)) register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c }), tags, ...(cat === 'food' ? { energy: Math.max(8, Math.round(price / 2)), mood: 1 } : {}) });
