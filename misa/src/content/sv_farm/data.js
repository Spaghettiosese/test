// Farm & Animals: save slice, items, the artisan machine registry, animal species and workbench recipes.
// Save data: game.state.sv_farm
//   animals: [{ id, sp, name, born, friend (0-1000, 100 per heart), hap (0-100), fed, pet, treat, sick, hand }]
//   machines: [{ id, kind, map, x, y, out, n, left, q, ready }]   bin: { itemId: n }   hay: n (trough)   q: { itemId: [silver, gold, star] }
//   ship: { items, total, bonus, days }   crow: { day, n, shooed, active }   report: [lines]
// Registry kinds added here: 'svMachine' { name, days, rec(itemId) -> { out, n?, days? } | null, need?, auto?, craft }.
import { register, get, all } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';

export const SV = (game) => game.state.sv_farm;
register('stateSlice', 'sv_farm', {
  default: () => ({
    animals: [], nextId: 1, machines: [], nextM: 1, bin: {}, hay: 0, q: {}, coopX: 0, barnX: 0, incubator: 0,
    ship: { items: {}, total: 0, bonus: 0, days: 0 }, crow: null, report: [], cut: {}, firstDay: 0, sold: {},
  }),
});

const mk = (id, name, cat, shape, c, price, desc, o = {}) => register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c, c2: o.c2 }), tags: o.tags || [cat], ...(o.x || {}) });
const food = (id, name, shape, c, price, desc, energy, tags = []) => mk(id, name, 'food', shape, c, price, desc, { tags: ['artisan', ...tags], x: { energy, mood: 2 } });

// ---------------------------------------------------------------- animal goods and farm supplies
food('art_egg', 'Egg', 'egg', Rr.paper[4], 40, 'A warm brown-speckled hen egg.', 8, ['egg', 'dairy']);
food('art_egg_large', 'Large egg', 'egg', Rr.butter[3], 70, 'A big double-yolker from a happy hen.', 12, ['egg', 'dairy']);
food('art_egg_fertile', 'Fertile egg', 'egg', Rr.sakura[3], 30, 'Keep it warm in the coop incubator and it may hatch.', 0, ['egg']);
food('art_duck_egg', 'Duck egg', 'egg', Rr.mint[3], 80, 'Rich and creamy. Bakers love these.', 12, ['egg', 'dairy']);
food('art_milk', 'Goat milk', 'carton', Rr.paper[4], 90, 'Sweet, fresh goat milk.', 12, ['milk', 'dairy']);
food('art_milk_large', 'Large goat milk', 'carton', Rr.sky[4], 140, 'A full pail of creamy goat milk.', 16, ['milk', 'dairy']);
mk('art_feather', 'Duck feather', 'material', 'feather', Rr.paper[4], 120, 'Soft and waterproof. Good for pillows.', { tags: ['material', 'artisan'] });
mk('art_wool', 'Alpaca wool', 'material', 'box', Rr.paper[3], 160, 'Cloud-soft alpaca fleece.', { tags: ['material', 'wool'] });
mk('art_wool_rabbit', 'Angora wool', 'material', 'box', Rr.paper[4], 150, 'Fluffy angora from the rabbits.', { tags: ['material', 'wool'] });
mk('art_rabbit_foot', 'Lucky rabbit foot', 'gift', 'toy', Rr.sakura[3], 300, 'A rabbit leaves one of these behind when it trusts you completely. Everyone loves it.', { tags: ['gift', 'universalLike'] });
mk('art_hay', 'Hay', 'misc', 'box', Rr.butter[2], 8, 'Dry golden hay. Fill the trough in the backyard pen.', { x: { buy: 25 } });
mk('art_animal_treat', 'Animal treat', 'misc', 'sweet', Rr.hairGinger[2], 30, 'Seed cake for farm animals. +25 friendship once a day each.', { x: { buy: 60 } });
mk('art_medicine', 'Animal tonic', 'misc', 'bottle', Rr.mint[2], 60, 'Cures a sick farm animal. The vet sells it too.', { x: { buy: 150 } });
mk('art_fert_quality', 'Quality fertiliser', 'material', 'seed', Rr.forest[2], 60, 'Spread on a growing crop: far more starred harvests.', { tags: ['material', 'garden'], x: { buy: 200 } });
mk('art_fert_speed', 'Speed fertiliser', 'material', 'seed', Rr.butter[2], 60, 'Spread on a growing crop: it grows a day faster.', { tags: ['material', 'garden'], x: { buy: 200 } });
mk('art_fert_retain', 'Moisture fertiliser', 'material', 'seed', Rr.sky[2], 60, 'The soil stays damp for two days instead of one.', { tags: ['material', 'garden'], x: { buy: 200 } });
mk('art_fert_giant', 'Giant fertiliser', 'material', 'seed', Rr.hairGinger[2], 90, 'Pumpkins and tomatoes may swell into giants.', { tags: ['material', 'garden'], x: { buy: 320 } });
export const FERTS = ['mat_fertiliser', 'art_fert_retain', 'art_fert_speed', 'art_fert_quality', 'art_fert_giant'];
export const FERT_NOTE = { mat_fertiliser: 'Basic compost: slightly better harvests.', art_fert_quality: 'Quality fertiliser: starred harvests.', art_fert_speed: 'Speed fertiliser: one day faster.', art_fert_retain: 'Moisture fertiliser: stays damp for two days.', art_fert_giant: 'Giant fertiliser: a chance at giant crops.' };

// ---------------------------------------------------------------- artisan goods (generated from the crop list)
const jar = (id, name, c, price, desc, tags) => mk(id, name, 'food', 'jar', c, price, desc, { c2: Rr.paper[4], tags: ['artisan', ...tags], x: { energy: 14, mood: 3 } });
for (const cr of all('crop')) {
  const k = cr.id.slice(5), base = get('item', cr.item), n = cr.name;
  if (cr.flower) { jar(`art_honey_${k}`, `${n} honey`, Rr.butter[2], Math.round(base.price * 2 + 70), `Honey the bees made from ${n.toLowerCase()} blossoms.`, ['honey', 'sweet']); continue; }
  if ((base.tags || []).includes('fruit')) {
    jar(`art_jam_${k}`, `${n} jam`, cr.c, Math.round(base.price * 2 + 50), `Bubbling ${n.toLowerCase()} jam, put up in a jar.`, ['jam', 'sweet']);
    mk(`art_dried_${k}`, `Dried ${n.toLowerCase()}`, 'food', 'fruit', cr.c2, Math.round(base.price * 3 + 20), `Sun-dehydrated ${n.toLowerCase()}. Chewy and sweet.`, { tags: ['artisan', 'dried', 'sweet'], x: { energy: 12, mood: 2 } });
  } else jar(`art_pickles_${k}`, `Pickled ${n.toLowerCase()}`, cr.c, Math.round(base.price * 2 + 50), `Crunchy ${n.toLowerCase()} pickled in a jar.`, ['pickles']);
}
jar('art_honey_wild', 'Wild honey', Rr.butter[1], 90, 'Honey from whatever was blooming nearby.', ['honey', 'sweet']);
food('art_mayo', 'Mayonnaise', 'jar', Rr.paper[4], 120, 'Creamy home-made mayo.', 10, ['mayo']);
food('art_mayo_large', 'Gold mayonnaise', 'jar', Rr.butter[3], 170, 'Extra rich mayo from large eggs.', 12, ['mayo']);
food('art_mayo_duck', 'Duck mayonnaise', 'jar', Rr.mint[3], 240, 'Golden duck-egg mayo. Cafe chefs fight over it.', 14, ['mayo']);
food('art_cheese', 'Goat cheese', 'box', Rr.butter[3], 200, 'A soft wheel of goat cheese.', 14, ['cheese', 'dairy']);
food('art_cheese_gold', 'Gold-label cheese', 'box', Rr.butter[2], 300, 'Aged wheel with a gold wax seal.', 18, ['cheese', 'dairy']);
mk('art_cloth', 'Alpaca cloth', 'material', 'shirt', Rr.paper[3], 380, 'Woven alpaca cloth. Warm and fine.', { tags: ['material', 'cloth', 'artisan'] });
mk('art_cloth_soft', 'Angora cloth', 'material', 'shirt', Rr.sakura[3], 360, 'Featherlight angora cloth.', { tags: ['material', 'cloth', 'artisan'] });
for (const [k, n, c, p] of [['aged', 'Aged sencha', Rr.forest[2], 150], ['mint', 'Mint tea leaves', Rr.mint[2], 140], ['chrysanthemum', 'Chrysanthemum tea', Rr.butter[2], 190], ['yuzu', 'Yuzu tea', Rr.butter[3], 210], ['camellia', 'Camellia tea', Rr.ribbon[2], 200]]) food(`art_tea_${k}`, n, 'cup', c, p, 'Slowly fermented in the backyard fermenter. Smells like a quiet afternoon.', 10, ['tea', 'drink']);
food('art_rice_flour', 'Rice flour', 'sack', Rr.paper[4], 110, 'Stone-milled rice flour for mochi and dango.', 4, ['flour']);
food('art_cornmeal', 'Cornmeal', 'sack', Rr.butter[2], 95, 'Coarse yellow cornmeal.', 4, ['flour']);
food('art_sweet_flour', 'Sweet potato starch', 'sack', Rr.lilac[3], 120, 'Fine starch for dumplings.', 4, ['flour']);

// ---------------------------------------------------------------- machines
const cropOf = (id) => get('crop', id);
const isFruit = (id) => ((get('item', id) || {}).tags || []).includes('fruit');
const veg = (id) => { const it = get('item', id); return !!it && it.cat === 'crop' && (it.tags || []).includes('veg') && !(it.tags || []).includes('flower'); };
const map1 = (tbl, days) => (id) => (tbl[id] ? { out: tbl[id], days, n: 1 } : null);
const M = (id, def) => register('svMachine', id, def);
M('jar', { name: 'Preserves jar', days: 3, empty: 'No fruit or vegetables to preserve right now.', craft: 'mat_wood*2 mat_glass*2 mat_clay', lvl: 1,
  rec: (id) => { const c = cropOf(id); if (!c || c.flower) return null; const k = id.slice(5); return isFruit(id) ? { out: `art_jam_${k}`, days: 3 } : { out: `art_pickles_${k}`, days: 2 }; } });
M('dehydrator', { name: 'Dehydrator', days: 1, empty: 'Needs fruit to dry: strawberries, tomatoes, yuzu or melon.', craft: 'mat_wood*3 mat_wire*2 mat_glass', lvl: 2,
  rec: (id) => (cropOf(id) && !cropOf(id).flower && isFruit(id) ? { out: `art_dried_${id.slice(5)}`, days: 1 } : null) });
M('mayo', { name: 'Mayonnaise machine', days: 1, empty: 'Needs eggs.', craft: 'mat_wood*2 mat_wire*3 mat_glass', lvl: 3,
  rec: map1({ art_egg: 'art_mayo', ing_egg: 'art_mayo', art_egg_large: 'art_mayo_large', art_duck_egg: 'art_mayo_duck' }, 1) });
M('cheese', { name: 'Cheese press', days: 2, empty: 'Needs milk.', craft: 'mat_wood*4 mat_wire*2', lvl: 3,
  rec: map1({ art_milk: 'art_cheese', ing_milk: 'art_cheese', art_milk_large: 'art_cheese_gold' }, 2) });
M('loom', { name: 'Loom', days: 1, empty: 'Needs wool.', craft: 'mat_wood*5 mat_string*3 mat_wire', lvl: 4,
  rec: map1({ art_wool: 'art_cloth', art_wool_rabbit: 'art_cloth_soft' }, 1) });
M('tea', { name: 'Tea fermenter', days: 3, empty: 'Needs tea leaves, mint, chrysanthemum, yuzu or camellia.', craft: 'mat_wood*3 mat_clay*2 mat_wire', lvl: 2,
  rec: map1({ ing_tea: 'art_tea_aged', ing_mint: 'art_tea_mint', crop_chrysanthemum: 'art_tea_chrysanthemum', crop_yuzu: 'art_tea_yuzu', crop_camellia: 'art_tea_camellia' }, 3) });
M('mill', { name: 'Mill', days: 1, empty: 'Needs rice, corn or sweet potatoes.', craft: 'mat_wood*5 tag:mineral*2 mat_wire', lvl: 4,
  rec: map1({ ing_rice: 'art_rice_flour', crop_corn: 'art_cornmeal', crop_sweet_potato: 'art_sweet_flour' }, 1) });
M('compost', { name: 'Compost bin', days: 2, need: 3, empty: 'Needs three scraps: vegetables or hay.', craft: 'mat_wood*3 mat_clay', lvl: 0,
  rec: (id) => (veg(id) || id === 'art_hay' ? { out: 'mat_fertiliser', n: 2, days: 2 } : null) });
M('bee', { name: 'Bee box', days: 4, auto: true, craft: 'mat_wood*4 mat_wire mat_glass', lvl: 2, rec: () => null });
// Tiers: water reach in tiles around the sprinkler (1 = the four neighbours, 2 = 3x3 ring, 3 = 5x5).
M('sprinkler_1', { name: 'Sprinkler', sprinkler: 1, craft: 'mat_wood mat_wire*2', lvl: 1, rec: () => null });
M('sprinkler_2', { name: 'Quality sprinkler', sprinkler: 2, craft: 'mat_wire*3 tag:mineral*2 mat_glass', lvl: 3, rec: () => null });
M('sprinkler_3', { name: 'Gold sprinkler', sprinkler: 3, craft: 'mat_wire*5 tag:mineral*4 mat_glass*2', lvl: 6, rec: () => null });
M('scarecrow', { name: 'Scarecrow', scare: 7, craft: 'mat_wood*3 mat_cloth*2 mat_string', lvl: 2, rec: () => null });
M('scarecrow_2', { name: 'Deluxe scarecrow', scare: 13, craft: 'mat_wood*4 mat_cloth*3 mat_string*2 mat_beads', lvl: 5, rec: () => null });

const DESC = {
  jar: 'Place it in the yard. Load fruit or vegetables and wait for jam or pickles.', dehydrator: 'Dries fruit into chewy snacks overnight.', mayo: 'Turns eggs into mayonnaise.', cheese: 'Presses milk into cheese.', loom: 'Weaves wool into cloth.',
  tea: 'Ferments leaves and petals into fine tea.', mill: 'Grinds rice, corn and sweet potatoes into flour.', compost: 'Rots scraps into fertiliser.', bee: 'Bees collect honey from flowers growing nearby.',
  sprinkler_1: 'Waters the four tiles around it every morning.', sprinkler_2: 'Waters the eight tiles around it every morning.', sprinkler_3: 'Waters a 5x5 square around it every morning.',
  scarecrow: 'Keeps crows away from crops within 7 tiles.', scarecrow_2: 'Keeps crows away from crops within 13 tiles.',
};
const SHAPE = { jar: 'bottle', dehydrator: 'box', mayo: 'box', cheese: 'box', loom: 'furniture', tea: 'jar', mill: 'box', compost: 'box', bee: 'box', scarecrow: 'toy', scarecrow_2: 'toy' };
for (const m of all('svMachine')) {
  const id = `mach_${m.id}`;
  register('item', id, { name: m.name, desc: DESC[m.id] + ' Use it facing an empty spot in the yard.', cat: 'misc', price: 150 + (m.lvl || 0) * 80, tags: ['machine'], icon: itemIcon(SHAPE[m.id] || 'tool', { c: Rr.wood[2], c2: Rr.metal[3] }), use: (g) => (g.svPlace ? !g.svPlace(m.id, id) : true) });
  register('craft', `craft_${id}`, { name: m.name, ingredients: Object.fromEntries(m.craft.split(' ').map((t) => { const [k, n] = t.split('*'); return [k, +(n || 1)]; })), out: id, n: 1, skill: m.lvl || 0 });
}
register('craft', 'craft_art_hay', { name: 'Bale of hay', ingredients: { 'tag:leafy': 2 }, out: 'art_hay', n: 3, skill: 0 });
register('craft', 'craft_art_fert_quality', { name: 'Quality fertiliser', ingredients: { mat_fertiliser: 2, 'tag:flower': 1 }, out: 'art_fert_quality', n: 2, skill: 2 });
register('craft', 'craft_art_fert_speed', { name: 'Speed fertiliser', ingredients: { mat_fertiliser: 2, mat_clay: 1 }, out: 'art_fert_speed', n: 2, skill: 3 });
register('craft', 'craft_art_fert_retain', { name: 'Moisture fertiliser', ingredients: { mat_fertiliser: 2, mat_cloth: 1 }, out: 'art_fert_retain', n: 2, skill: 3 });
register('craft', 'craft_art_animal_treat', { name: 'Animal treats', ingredients: { 'tag:veg': 1, ing_rice: 1 }, out: 'art_animal_treat', n: 3, skill: 1 });

// ---------------------------------------------------------------- animals
// every: days between products once grown; home: coop or barn
export const SPECIES = {
  chicken: { name: 'Chicken', baby: 'Chick', cost: 400, grow: 4, home: 'coop', every: 1, look: 'Plump and chatty.', names: ['Pepper', 'Mochi-hen', 'Clucky', 'Nugget', 'Tamago', 'Biscuit', 'Hanabi', 'Mugi'], snd: 'chirp' },
  duck: { name: 'Duck', baby: 'Duckling', cost: 600, grow: 5, home: 'coop', every: 2, look: 'Waddles everywhere in a line.', names: ['Puddle', 'Kamo', 'Sir Quacks', 'Dumpling', 'Waddles', 'Ume', 'Pochi'], snd: 'quack' },
  rabbit: { name: 'Rabbit', baby: 'Kit', cost: 800, grow: 5, home: 'coop', every: 3, look: 'Shy until you bring a treat.', names: ['Usagi', 'Clover', 'Mochi-bun', 'Pom', 'Yuki', 'Hoppy', 'Kinako'], snd: 'pop' },
  goat: { name: 'Goat', baby: 'Kid', cost: 1500, grow: 6, home: 'barn', every: 2, look: 'Curious and a bit of a thief.', names: ['Hiro', 'Daisy', 'Maple', 'Gouda', 'Yagi', 'Biscotti', 'Sora'], snd: 'mew' },
  alpaca: { name: 'Alpaca', baby: 'Cria', cost: 2000, grow: 7, home: 'barn', every: 3, look: 'Haughty, fluffy and secretly sweet.', names: ['Kumo', 'Llama-san', 'Fluff', 'Marshmallow', 'Pablo', 'Cocoa', 'Nimbus'], snd: 'mew' },
};
export const CAP = { coop: 6, barn: 4 };
export const capacity = (game, home) => CAP[home] + (home === 'coop' ? SV(game).coopX : SV(game).barnX);
export const hearts = (a) => Math.min(10, Math.floor(a.friend / 100));
export const isBaby = (game, a) => game.day - a.born < SPECIES[a.sp].grow;
