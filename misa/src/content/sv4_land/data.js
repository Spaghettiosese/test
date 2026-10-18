// Mountain & Meadow (sv4_land): save slice, shared helpers, items, trail badges, stamp rally and fish.
// Save data: game.state.sv4_land
//   visited {map:1}  stamina (0-100)  badges {id:day}  stamps {id:day}  rallyPaid  soak {day,n,per:{bath:n}}  etiq (day)  washed (day)
//   pass (day, bath day-pass)  stay {paid day, night}  cabin (last day the rental covers)  expo (storm exposure seconds)  rescues
//   forage {day,taken:{}}  orchard {day,pass,taken:{}}  ranch {friend:{name:n}, milked:{name:day}, sheared:{name:day}}  flour n  rows {best}  ski {best}
//   cats {fed:day, fedN, names:{}}  monkeys n  deer n  medit n  clouds n  arcs {npc:stage}  cub (guide cub count)
// Items use the infixes tk (Mount Tsukimi), yk (Yukemuri), ml (Meadow Hills). Events: sv4Badge {id}, sv4Stamp {id}, sv4Soak {bath}, sv4Rescued.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';

export const SV4 = (g) => g.state.sv4_land;
register('stateSlice', 'sv4_land', {
  default: () => ({
    visited: {}, stamina: 100, badges: {}, stamps: {}, rallyPaid: false, soak: { day: 0, n: 0, per: {} }, etiq: 0, washed: 0, pass: 0,
    stay: { paid: 0, night: 0 }, cabin: 0, expo: 0, rescues: 0, forage: { day: 0, taken: {}, n: 0 }, orchard: { day: 0, pass: 0, taken: {} },
    ranch: { friend: {}, milked: {}, sheared: {}, brushed: {} }, flour: 0, rows: { best: 0 }, ski: { best: 0 }, cats: { fed: 0, fedN: 0, hearts: 0 },
    monkeys: 0, deer: 0, medit: 0, clouds: 0, arcs: {}, wheat: { day: 0, taken: {} }, prospect: { day: 0, taken: {} }, bellsRung: 0, cave: false, bookClaims: {},
  }),
});
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hourOf = (g) => g.minutes / 60;
export const nm = (id) => (get('item', id) || { name: id }).name;
export const say = (g, text, who = null) => g.run([{ t: 'say', who, mood: who ? 'neutral' : undefined, text }]);

// ---------------------------------------------------------------- items
const mk = (id, name, cat, shape, c, price, desc, o = {}) => register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c, c2: o.c2 }), tags: o.tags || [cat], ...(o.x || {}) });
const food = (id, name, shape, c, price, desc, energy, mood = 2, tags = []) => mk(id, name, 'food', shape, c, price, desc, { tags: ['food', ...tags], x: { energy, mood } });

// Mountain forage: [id, name, seasons, maps, shape, c, c2, price, energy, rarity, desc]
const ALL = ['spring', 'summer', 'autumn', 'winter'];
export const TK_FORAGE = [
  ['tk_warabi', 'Bracken fern', ['spring'], ['forest'], 'leafy', Rr.forest[2], Rr.mint[2], 40, 6, 1, 'Curled fern fiddles from the mountain slope. Rinse well before eating.'],
  ['tk_butterbur', 'Butterbur shoot', ['spring'], ['forest', 'falls'], 'leafy', Rr.mint[2], Rr.forest[2], 45, 6, 1, 'A bitter-sweet fuki shoot that pops up beside streams.'],
  ['tk_wasabi', 'Mountain wasabi', ALL, ['falls'], 'root', Rr.mint[3], Rr.forest[2], 120, 4, 3, 'Grows in cold clear water below the falls. Hot and fresh.'],
  ['tk_bilberry', 'Mountain bilberry', ['summer'], ['forest', 'summit'], 'berry', Rr.lilac[1], Rr.navy[2], 60, 8, 1, 'Tiny blue-black berries that stain your fingers.'],
  ['tk_alpine_rose', 'Alpine rose', ['summer'], ['summit'], 'flower', Rr.ribbon[2], Rr.paper[4], 90, 0, 3, 'A hardy pink flower that grows right up to the summit rocks.'],
  ['tk_maitake', 'Maitake', ['autumn'], ['forest'], 'mushroom', Rr.woodDark[3], Rr.sand[2], 110, 12, 3, 'Hen-of-the-woods, a frilly mushroom found at the foot of old oaks.'],
  ['tk_shimeji', 'Shimeji', ['autumn'], ['forest'], 'mushroom', Rr.paper[3], Rr.sand[3], 70, 8, 2, 'A cluster of little beech mushrooms. Good in hot pot.'],
  ['tk_mountain_yam', 'Mountain yam', ['autumn'], ['forest'], 'root', Rr.sand[3], Rr.paper[3], 85, 12, 2, 'Sticky, earthy yamaimo dug from the leaf litter.'],
  ['tk_koyo_leaf', 'Red maple leaf', ['autumn'], ['forest', 'falls', 'summit'], 'leafy', Rr.ribbon[2], Rr.butter[2], 35, 0, 1, 'A perfect koyo leaf, red at the tip and gold at the stem.'],
  ['tk_frost_thistle', 'Frost thistle', ['winter'], ['forest', 'summit'], 'flower', Rr.sky[3], Rr.paper[4], 75, 0, 2, 'A spiky thistle furred with frost. It never seems to melt.'],
  ['tk_pine_resin', 'Pine resin', ['winter'], ['forest'], 'seed', Rr.butter[3], Rr.wood[2], 60, 0, 2, 'Amber resin from a mountain pine. Smells like a clean forest.'],
];
for (const [k, name, , , shape, c, c2, price, energy, rarity, desc] of TK_FORAGE) {
  mk(`forage_${k}`, name, 'crop', shape, c, price, desc, { c2, tags: ['forage', 'mountain', k.slice(3)], x: { energy, mood: energy ? 2 : 1, rarity } });
}
// Minerals from the falls cave and the summit rocks
[['sulfur', 'Sulfur crystal', Rr.butter[2], 55, 'Yellow crystals that smell of hot springs.', 1], ['obsidian', 'Obsidian', Rr.charcoal[1], 130, 'Black volcanic glass with a razor edge.', 2],
  ['onsen_crystal', 'Onsen crystal', Rr.sky[4], 220, 'A silica crystal grown slowly in warm spring water.', 3], ['moonglass', 'Moon glass', Rr.lilac[4], 420, 'Pale glass that glows faintly under the moon. Very rare.', 4]]
  .forEach(([k, name, c, price, desc, rarity]) => mk(`min_tk_${k}`, name, 'mineral', 'gem', c, price, desc, { tags: ['mineral', 'mountain'], x: { rarity } }));

// ---------------------------------------------------------------- food, drinks and gifts
food('dish_tk_oyaki', 'Oyaki dumpling', 'bread', Rr.sand[3], 70, 'A stuffed mountain dumpling, steaming from the grill.', 18, 3, ['snack']);
food('dish_tk_trail_mix', 'Trail mix', 'sweet', Rr.hairGinger[2], 45, 'Nuts, raisins and a single chocolate for morale.', 16, 2, ['snack']);
food('dish_tk_mountain_stew', 'Mountain stew', 'bowl', Rr.wood[2], 120, 'Root vegetables, mushrooms and miso, simmered all morning at the hut.', 34, 5, ['meal']);
food('dish_tk_grilled_ayu', 'Grilled ayu', 'fish', Rr.sky[3], 95, 'A stream fish on a salt-crusted skewer.', 24, 3, ['fish']);
food('drink_tk_hot_amazake', 'Hot amazake', 'cup', Rr.paper[4], 60, 'Warm, sweet rice drink for cold hands.', 14, 4, ['drink']);
food('dish_yk_onsen_egg', 'Onsen egg', 'egg', Rr.butter[3], 80, 'Cooked slowly in the hot spring. Silky inside.', 18, 3, ['egg']);
food('dish_yk_manju', 'Onsen manju', 'sweet', Rr.sand[3], 85, 'Brown steamed bun with sweet bean paste.', 20, 4, ['sweet']);
food('drink_yk_fruit_milk', 'Bath fruit milk', 'bottle', Rr.paper[4], 70, 'Ice-cold fruit milk, to be drunk after the bath with one hand on the hip.', 16, 5, ['drink']);
food('dish_yk_kaiseki', 'Kaiseki dinner', 'plate', Rr.coral[2], 0, 'A many-dish dinner served at the ryokan.', 40, 8, ['meal']);
food('dish_yk_cat_snack', 'Cat snack', 'fish', Rr.coral[3], 40, 'Dried fish bits. The onsen cats consider these legal tender.', 0, 0, ['pet']);
food('dish_ml_cheese_toast', 'Ranch cheese toast', 'bread', Rr.butter[3], 90, 'Thick toast under bubbling ranch cheese.', 26, 4, ['meal']);
food('dish_ml_corn_grill', 'Grilled corn', 'leafy', Rr.butter[2], 60, 'Sweet corn on the cob, brushed with soy.', 20, 3, ['snack']);
food('dish_ml_cherry_pie', 'Orchard pie', 'plate', Rr.ribbon[2], 110, 'A slice of the seasonal orchard pie.', 28, 5, ['sweet']);
food('dish_ml_soba', 'Windmill soba', 'bowl', Rr.paper[3], 100, 'Buckwheat noodles from the windmill, with cold dipping broth.', 30, 4, ['meal']);
food('drink_ml_fresh_milk', 'Fresh milk bottle', 'bottle', Rr.paper[4], 55, 'Cold milk still smelling of the pasture.', 14, 3, ['drink', 'dairy']);
mk('ing_ml_wheat', 'Wheat sheaf', 'crop', 'leafy', Rr.butter[2], 35, 'A bundle of golden wheat. Take it to the windmill.', { tags: ['crop', 'ingredient', 'grain'] });
mk('ing_ml_buckwheat', 'Buckwheat', 'crop', 'seed', Rr.sand[3], 38, 'Triangular buckwheat grains, ready for milling.', { tags: ['crop', 'ingredient', 'grain'] });
mk('ing_ml_soba_flour', 'Soba flour', 'food', 'sack', Rr.paper[3], 95, 'Dark, fragrant buckwheat flour.', { tags: ['ingredient', 'flour'], x: { energy: 4 } });
mk('ing_ml_mikan', 'Mikan', 'food', 'fruit', Rr.hairGinger[2], 50, 'Winter orange from the orchard hill.', { tags: ['ingredient', 'fruit'], x: { energy: 10, mood: 2 } });
mk('forage_ml_lotus', 'Lake lotus', 'crop', 'flower', Rr.sakura[3], 100, 'A pale lotus bloom from the lake shallows.', { c2: Rr.mint[2], tags: ['forage', 'flower'], x: { rarity: 2 } });
// souvenirs, gifts and kit
mk('gift_yk_kokeshi', 'Kokeshi doll', 'gift', 'toy', Rr.coral[2], 260, 'A tiny wooden doll with a painted smile.', { tags: ['gift', 'souvenir'] });
mk('gift_yk_towel', 'Onsen towel', 'gift', 'shirt', Rr.sky[3], 180, 'A thin cotton towel printed with steam swirls.', { tags: ['gift', 'souvenir', 'bath'] });
mk('gift_yk_sulfur_soap', 'Sulfur soap', 'gift', 'box', Rr.butter[2], 150, 'Cloudy yellow soap that smells like the village.', { tags: ['gift', 'souvenir', 'bath'] });
mk('gift_yk_bath_salts', 'Spring bath salts', 'gift', 'jar', Rr.mint[3], 200, 'A jar of salts that turn your tub into a mini onsen.', { tags: ['gift', 'souvenir', 'bath'] });
mk('gift_yk_snow_globe', 'Snow globe', 'gift', 'toy', Rr.sky[4], 320, 'Inside, tiny Yukemuri is always snowing.', { tags: ['gift', 'souvenir', 'cute'] });
mk('gift_yk_charm', 'Hot spring charm', 'gift', 'star', Rr.ribbon[2], 220, 'A little amulet for a warm and healthy year.', { tags: ['gift', 'souvenir'] });
mk('gift_yk_stamp_towel', 'Rally towel', 'gift', 'shirt', Rr.butter[3], 600, 'The golden Stamp Rally towel: you soaked in all six baths.', { tags: ['gift', 'souvenir', 'bath', 'universalLike'] });
mk('gift_tk_bear_bell', 'Bear bell', 'gift', 'star', Rr.butter[2], 140, 'A brass bell that tinkles as you walk. Hikers swear by it.', { tags: ['gift', 'hiking'] });
mk('gift_tk_golden_bell', 'Golden trail bell', 'gift', 'star', Rr.butter[4], 700, 'Awarded for all twelve Trail Book badges.', { tags: ['gift', 'hiking', 'universalLike'] });
mk('tool_tk_stick', 'Walking stick', 'tool', 'tool', Rr.wood[2], 400, 'A carved hiking stick: trails cost less stamina while you carry it.', { tags: ['tool', 'hiking'] });
mk('tool_tk_poncho', 'Rain poncho', 'tool', 'shirt', Rr.mint[2], 320, 'Keeps the mountain weather off. Storm exposure builds much slower.', { tags: ['tool', 'hiking'] });
mk('key_tk_trail_book', 'Trail Book', 'key', 'book', Rr.forest[2], 0, 'Your hiker\'s Trail Book. Twelve badges to earn.', { x: { key: true } });
mk('key_yk_rally_card', 'Stamp Rally card', 'key', 'stamp', Rr.ribbon[2], 0, 'A card with six stamp boxes, one for every bath in the region.', { x: { key: true } });
mk('gift_ml_straw_hat', 'Straw hat', 'gift', 'hat', Rr.butter[2], 240, 'A broad meadow hat that smells of sunshine.', { tags: ['gift', 'farm'] });
mk('gift_ml_wool_socks', 'Wool socks', 'gift', 'shirt', Rr.paper[3], 210, 'Thick ranch wool socks in oatmeal and cream.', { tags: ['gift', 'farm'] });
mk('gift_ml_honey', 'Meadow honey', 'gift', 'jar', Rr.butter[3], 230, 'Clover honey from the hill hives.', { tags: ['gift', 'farm', 'sweet'] });
mk('gift_ml_cheese_box', 'Cheese box', 'gift', 'box', Rr.butter[2], 280, 'A boxed wheel of ranch cheese, tied with string.', { tags: ['gift', 'farm'] });
mk('gift_ml_lantern', 'Lake lantern', 'gift', 'toy', Rr.coral[2], 150, 'A paper lantern for floating on the lake at dusk.', { tags: ['gift', 'cute'] });
mk('gift_ml_horseshoe', 'Lucky horseshoe', 'gift', 'toy', Rr.metal[3], 260, 'Hung over a door, it keeps luck from falling out.', { tags: ['gift', 'farm', 'universalLike'] });

// ---------------------------------------------------------------- lake fish (Meadow Hills lake, 8 new)
// [id, name, shape, c, c2, seasons, times, weather, rarity, size, price, desc]
export const LAKE_FISH = [
  ['wakasagi', 'Lake smelt', 'fish2', Rr.sky[4], Rr.paper[3], ALL, 'any', 'any', 1, [6, 12], 40, 'A silver wakasagi, fried whole by lakeside stalls.'],
  ['perch', 'Lake perch', 'fish', Rr.forest[2], Rr.butter[2], ['spring', 'summer', 'autumn'], 'day', 'any', 1, [14, 25], 55, 'Striped like a tiny tiger.'],
  ['catfish', 'Lake catfish', 'eel', Rr.charcoal[3], Rr.stone[2], ['summer', 'autumn'], 'night', 'any', 2, [35, 70], 180, 'Whiskers first. It sleeps in the reeds by day.'],
  ['bass', 'Meadow bass', 'fish', Rr.forest[3], Rr.mint[2], ['spring', 'summer'], 'day', 'clear', 2, [28, 50], 160, 'A feisty bass that fights all the way to the net.'],
  ['sweetfish', 'Sweetfish', 'fish2', Rr.mint[3], Rr.butter[3], ['summer', 'autumn'], 'any', 'any', 3, [15, 28], 240, 'Ayu, scented like watermelon. Prized at the market.'],
  ['lake_trout', 'Lake trout', 'fish', Rr.sky[3], Rr.coral[2], ['autumn', 'winter', 'spring'], 'any', 'any', 3, [40, 70], 280, 'Cold-water trout with a rosy belly.'],
  ['golden_carp', 'Golden carp', 'fish2', Rr.butter[3], Rr.hairGinger[2], ['summer'], 'day', 'clear', 4, [45, 85], 520, 'A carp the colour of sunrise, said to bring luck.'],
  ['moon_koi', 'Moon koi', 'fish2', Rr.paper[4], Rr.lilac[3], ALL, 'night', 'clear', 5, [70, 110], 1500, 'A pale legend that surfaces only under a clear night sky.'],
];
for (const [k, name, shape, c, c2, seasons, times, weather, rarity, size, price, desc] of LAKE_FISH) {
  const id = `fish_ml_${k}`;
  register('item', id, { name, desc, cat: 'fish', price, icon: itemIcon(shape, { c, c2 }), tags: ['fish', k, ...(rarity >= 5 ? ['legend'] : [])], rarity });
  register('fish', id, { item: id, name, maps: ['meadow_lake'], seasons, times, weather, rarity, size, legend: rarity >= 5, shape, c });
}

// ---------------------------------------------------------------- trail badges, stamps, trails
export const BADGES = [
  ['first_steps', 'First Steps', 'Arrive at the Tsukimi Trailhead.', 'Trailhead'],
  ['bear_bell', 'Bear Bell', 'Ring a bear bell on the trail.', 'Trailhead'],
  ['forager', 'Forager', 'Pick 8 mountain forage items.', 'Forest'],
  ['bridge', 'Bridge Crosser', 'Cross the rope bridge over the stream.', 'Forest'],
  ['deer_friend', 'Deer Friend', 'Pet a deer on the trail.', 'Forest'],
  ['falls', 'Falls Seeker', 'Reach the Tsukimi Falls pool.', 'Falls'],
  ['cave', 'Cave Explorer', 'Find the hidden spring cave behind the falls.', 'Falls'],
  ['still_mind', 'Still Mind', 'Meditate at the falls.', 'Falls'],
  ['summit', 'Summit', 'Stand on the Mount Tsukimi lookout.', 'Summit'],
  ['cloud_sea', 'Sea of Clouds', 'Photograph the dawn sea of clouds.', 'Summit'],
  ['storm_wise', 'Storm Wise', 'Take shelter, or be helped, in a mountain storm.', 'Weather'],
  ['snow_glide', 'Snow Glide', 'Finish a ski or sled run in winter.', 'Winter'],
];
export const STAMPS = [
  ['public_in', 'Public indoor bath', 'onsen_bath'], ['public_out', 'Public open-air bath', 'onsen_bath'], ['footbath', 'Footbath plaza', 'yukemuri_village'],
  ['cave', 'Hidden cave spring', 'tsukimi_falls'], ['ryokan', 'Ryokan room tub', 'ryokan_room'], ['hut', 'Hut barrel bath', 'mountain_hut'],
];
export const TRAILS = [
  ['Beginner path', 'Trailhead to the forest start', 'tsukimi_trailhead', 'Easy'], ['Switchback trail', 'Ten bends up the forest slope', 'tsukimi_forest', 'Moderate'],
  ['Falls trail', 'West branch to the pool', 'tsukimi_falls', 'Easy'], ['Summit trail', 'North to the lookout', 'tsukimi_summit', 'Hard'],
  ['Village path', 'East road to Yukemuri', 'yukemuri_village', 'Easy'], ['Meadow ridge walk', 'Road, orchard and lake', 'meadow_road', 'Easy'],
];
export const PLACES = [
  ['tsukimi_trailhead', 'Tsukimi Trailhead', 'Carpark, tea stall and the Trail Book desk. North road from town.'], ['tsukimi_forest', 'Tsukimi Forest', 'Switchbacks, mushrooms, deer and the rope bridge.'],
  ['tsukimi_falls', 'Tsukimi Falls', 'A waterfall pool, a hidden cave spring and a meditation rock.'], ['tsukimi_summit', 'Tsukimi Summit', 'Telescope, shrine and the dawn sea of clouds.'],
  ['yukemuri_village', 'Yukemuri Village', 'Hot-spring town: ryokan, public bath, footbath and souvenirs.'], ['ryokan_lobby', 'Ryokan Kitsune-no-Yu', 'Book a night; a tatami room with a private tub.'],
  ['onsen_bath', 'Yukemuri Public Bath', 'Indoor and open-air baths, etiquette lessons.'], ['mountain_hut', 'Tsukimi Hut', 'A hiker\'s hut with a stove and bunks.'],
  ['meadow_road', 'Meadow Road', 'Hub of Meadow Hills, east of Lantern Lane.'], ['meadow_ranch', 'Meadow Ranch', 'Cows, sheep and horses; milk and shear.'],
  ['meadow_windmill', 'Windmill', 'A working flour mill and wheat field.'], ['meadow_orchard', 'Meadow Orchard', 'U-pick fruit rows by season.'],
  ['meadow_lake', 'Meadow Lake', 'Boats, fishing and the cabin path.'], ['meadow_market', 'Meadow Market', 'Weekend farmers\' market and barn dances.'], ['meadow_cabin', 'Lakeside Cabin', 'Rent it for a weekend getaway.'],
];

// ---------------------------------------------------------------- shared services
// Awards a trail badge once. Returns true when new.
export function badge(game, id) {
  const S = SV4(game);
  if (!S || S.badges[id]) return false;
  const b = BADGES.find((x) => x[0] === id); if (!b) return false;
  S.badges[id] = game.day; game.sfx('star'); game.toast(`Trail badge: ${b[1]}`, 'i_star'); game.stat('trailBadges'); game.bus.emit('sv4Badge', { id });
  const n = Object.keys(S.badges).length;
  if (n === 4) { game.give('tool_tk_stick', 1, true); game.toast('4 badges! The guide association sends a walking stick', 'i_star'); }
  if (n === 8) { game.addMoney(500); game.toast('8 badges! +500 coins from the hiking club', 'i_coin'); }
  if (n === 12) { game.give('gift_tk_golden_bell', 1, true); if (game.giveStickers) game.giveStickers(5, 'all twelve trail badges'); game.setFlag('sv4_trail_master'); }
  return true;
}
export function stamp(game, id) {
  const S = SV4(game);
  if (!S || S.stamps[id]) return false;
  S.stamps[id] = game.day; game.sfx('chime'); game.toast(`Stamp collected: ${STAMPS.find((x) => x[0] === id)[1]}`, 'i_star'); game.stat('rallyStamps'); game.bus.emit('sv4Stamp', { id });
  if (Object.keys(S.stamps).length === STAMPS.length && !S.rallyPaid) {
    S.rallyPaid = true; game.addMoney(1500); game.give('gift_yk_stamp_towel', 1, true); if (game.giveStickers) game.giveStickers(3, 'hot spring stamp rally');
    game.setFlag('sv4_rally_done'); game.toast('Stamp Rally complete! 1500 coins and the golden towel', 'i_trophy');
  }
  return true;
}
export const stampsGot = (g) => Object.keys(SV4(g).stamps).length;
export const badgesGot = (g) => Object.keys(SV4(g).badges).length;
// Mountain weather: 'thunder' | 'snow' | 'fog' | 'clear'
export function mtWeather(game) {
  if (game.weather === 'storm') return 'thunder';
  if (game.season === 'winter' || game.weather === 'snow') return 'snow';
  if (game.weather === 'rain') return 'fog';
  return game.rngFor('tk_fog')() < 0.22 && game.minutes < 10 * 60 ? 'fog' : 'clear';
}
export const onMountain = (id) => ['tsukimi_trailhead', 'tsukimi_forest', 'tsukimi_falls', 'tsukimi_summit'].includes(id);
export const exposedMap = (id) => ['tsukimi_forest', 'tsukimi_falls', 'tsukimi_summit'].includes(id);
export function addStamina(game, n) { const S = SV4(game); S.stamina = clamp(S.stamina + n, 0, 100); }

features('Mountain & Meadow', [
  'Trail Book: a hiker\'s book with twelve trail badges (first steps, bear bell, forager, rope bridge, deer friend, falls, hidden cave, still mind, summit, sea of clouds, storm wise, snow glide) and rewards at 4, 8 and 12',
  'New mountain forage (bracken, butterbur, wasabi, bilberry, alpine rose, maitake, shimeji, mountain yam, koyo leaves, frost thistle, pine resin) that changes with the season',
  'Four mountain minerals (sulfur, obsidian, onsen crystal, moon glass) found by prospecting the cave and summit rocks',
  'Eight new Meadow Lake fish, from the lake smelt to the legendary night-time moon koi',
  'Hot-spring food and drink, trail snacks, ranch dishes and souvenirs: onsen eggs, manju, fruit milk, oyaki, mountain stew, cheese toast, kokeshi dolls, snow globes and more',
]);
