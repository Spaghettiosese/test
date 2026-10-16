// Exploring slice (Stardew-style systems): save slice, items, the two new skills and shared helpers.
//
// Save data: game.state.sv_explore = { mine, forage, pan, prof, tools }.
// Items: forage_* (foraging), ore_* and mat_bar_* (mine), min_* gems (museum donates them automatically), tool_pickaxe(_2,_3),
// tool_pan(_2), mat_stardust. Skills added: foraging, mining. Events emitted: foraged { item }, mined { item, kind },
// mineFloor { floor, best }, toolUpgraded { tool }, professionChosen { skill, level, id }, geodeCracked { item }, panned { item }.
import { register } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';

register('stateSlice', 'sv_explore', {
  default: () => ({
    mine: { floor: 0, best: 0, elev: 0, day: 0, broken: {}, ladders: {}, gone: {}, rewards: {}, swings: 0, faints: 0, shooed: 0, ores: {} },
    forage: { day: 0, taken: {}, found: 0, truffles: 0 },
    pan: { day: 0, taken: {}, count: 0 },
    prof: { picked: {}, seen: {} },
    tools: { queue: [], ready: [], upgrades: 0, cracked: 0, smelted: 0, daifuku: false },
  }),
});
export const SV = (game) => game.state.sv_explore;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- skills
const sk = (id, name, desc, shape, c, how) => register('skill', id, { name, desc, icon: itemIcon(shape, { c }), color: c, how });
sk('foraging', 'Foraging', 'Wild leeks, chestnuts and the odd truffle, picked fresh around Hoshimori Bay.', 'leafy', Rr.forest[3], 'Pick forage, pan for treasure');
sk('mining', 'Mining', 'Swinging a pickaxe down in the Hoshi Mine for ore, gems and geodes.', 'rock', Rr.stone[3], 'Mine rocks, shoo dust sprites');
export const SKILL_ORDER = ['homemaking', 'study', 'cooking', 'gardening', 'fishing', 'crafting', 'charm', 'foraging', 'mining'];

// ---------------------------------------------------------------- items
function item(id, name, cat, price, shape, c, desc, extra = {}) {
  const { c2, c3, ...rest } = extra;
  register('item', id, { name, cat, price, desc, icon: itemIcon(shape, { c, c2, c3 }), ...rest });
}
// Forage: [id, name, seasons, habitat, shape, colour, colour2, price, energy, rarity, description]
// habitat: field = grass areas, wood = shrine/park trees, sand = beach
export const FORAGE = [
  ['leek', 'Wild leek', ['spring'], 'field', 'leafy', Rr.mint[2], Rr.paper[4], 35, 8, 1, 'A bright wild leek from the roadside.'],
  ['dandelion', 'Dandelion', ['spring'], 'field', 'flower', Rr.butter[2], Rr.forest[3], 25, 5, 1, 'Cheerful and a bit bitter in tea.'],
  ['wild_berry', 'Wild berry', ['spring'], 'wood', 'berry', Rr.ribbon[2], Rr.forest[2], 30, 8, 1, 'Sweet-sour berries hiding in the bushes.'],
  ['bamboo_shoot', 'Bamboo shoot', ['spring'], 'wood', 'root', Rr.sand[2], Rr.forest[3], 45, 6, 2, 'Tender shoots. Grandma boils them with soy.'],
  ['wild_grape', 'Wild grape', ['summer'], 'wood', 'berry', Rr.lilac[2], Rr.forest[2], 40, 8, 1, 'Tiny purple grapes, sun-warm.'],
  ['seashell', 'Pretty seashell', ['summer'], 'sand', 'shell', Rr.coral[3], Rr.paper[3], 35, 0, 1, 'A summer shell with a pink swirl.'],
  ['shiso', 'Shiso leaf', ['summer'], 'field', 'leafy', Rr.lilac[1], Rr.forest[2], 30, 6, 1, 'Fragrant red-green leaf that wraps rice nicely.'],
  ['hibiscus', 'Hibiscus', ['summer'], 'field', 'flower', Rr.coral[2], Rr.butter[2], 40, 0, 2, 'A big tropical flower; makes a ruby tea.'],
  ['chestnut', 'Chestnut', ['autumn'], 'wood', 'seed', Rr.woodDark[3], Rr.wood[2], 35, 10, 1, 'Spiky outside, creamy inside.'],
  ['wild_mushroom', 'Wild mushroom', ['autumn'], 'wood', 'mushroom', Rr.hairGinger[2], Rr.paper[3], 40, 8, 1, 'A forest mushroom. Cook it well.'],
  ['matsutake', 'Matsutake', ['autumn'], 'wood', 'mushroom', Rr.sand[3], Rr.wood[2], 160, 14, 4, 'The prized autumn mushroom. Smells like the whole forest.'],
  ['ginkgo', 'Ginkgo nut', ['autumn'], 'field', 'seed', Rr.butter[3], Rr.sand[2], 30, 6, 1, 'Smelly tree, tasty nuts.'],
  ['crocus', 'Winter crocus', ['winter'], 'field', 'flower', Rr.lilac[3], Rr.butter[2], 45, 0, 2, 'A brave little flower pushing through the snow.'],
  ['snow_yam', 'Snow yam', ['winter'], 'field', 'root', Rr.paper[3], Rr.lilac[2], 55, 12, 2, 'Dug out of frozen ground. Surprisingly sweet.'],
  ['holly', 'Holly sprig', ['winter'], 'wood', 'leafy', Rr.forest[2], Rr.ribbon[2], 35, 0, 1, 'Glossy leaves and red berries.'],
  ['camellia', 'Camellia', ['winter'], 'wood', 'flower', Rr.coral[2], Rr.butter[2], 50, 0, 2, 'A winter bloom, red as a lantern.'],
];
for (const [k, name, seasons, hab, shape, c, c2, price, energy, rarity, desc] of FORAGE) {
  item('forage_' + k, name, k === 'seashell' ? 'shell' : 'crop', price, shape, c, desc, { c2, seasons, hab, rarity, tags: ['forage', k], ...(energy ? { energy, mood: 1 } : {}) });
}
item('forage_hoshi_truffle', 'Hoshi truffle', 'crop', 300, 'mushroom', Rr.charcoal[3], 'A rare dark truffle that grows under the shrine forest. Sniffed out by luck alone.', { c2: Rr.sand[3], rarity: 5, tags: ['forage', 'truffle'], energy: 20, mood: 3 });

// Ore, coal, geodes, bars
const ore = (id, name, price, shape, c, desc, extra = {}) => item(id, name, 'material', price, shape, c, desc, { ...extra, tags: ['ore', ...(extra.tags || [])] });
ore('ore_stone', 'Stone', 2, 'rock', Rr.stone[3], 'A lump of mine stone. Handy for building and crafts.');
ore('ore_coal', 'Coal', 15, 'rock', Rr.charcoal[2], 'Burns hot and long. Tobias uses it to smelt.');
ore('ore_copper', 'Copper ore', 25, 'nugget', Rr.hairGinger[2], 'Orange-green ore. Smelt three into a bar.');
ore('ore_iron', 'Iron ore', 40, 'nugget', Rr.metal[3], 'Heavy grey ore with a rusty edge.');
ore('ore_silver', 'Silver ore', 70, 'nugget', Rr.paper[3], 'Gleams like moonlight on the bay.', { c2: Rr.sky[3] });
ore('ore_star_gold', 'Star-gold ore', 130, 'nugget', Rr.butter[3], 'Warm gold flecked with tiny stars. Only deep down.', { c2: Rr.butter[1] });
item('ore_frozen_geode', 'Frozen geode', 'mineral', 60, 'geode', Rr.sky[3], 'Cold to hold. Tobias can crack it open for 40 coins.', { c2: Rr.sky[1], tags: ['geode'] });
item('ore_star_geode', 'Star geode', 'mineral', 110, 'geode', Rr.butter[3], 'It hums faintly. Tobias can crack it open for 75 coins.', { c2: Rr.lilac[2], tags: ['geode'] });
item('mat_stardust', 'Dust sprite fluff', 'material', 18, 'seed', Rr.paper[3], 'Soft grey fluff left by a dust sprite you shooed gently away.', { c2: Rr.lilac[3], tags: ['dust'] });
for (const [k, name, price, c, desc] of [['copper', 'Copper bar', 120, Rr.hairGinger[2], 'A shiny copper bar.'], ['iron', 'Iron bar', 220, Rr.metal[3], 'A solid iron bar.'], ['silver', 'Silver bar', 380, Rr.paper[4], 'A bright silver bar.'], ['star_gold', 'Star-gold bar', 700, Rr.butter[3], 'A glowing star-gold bar.']]) {
  item('mat_bar_' + k, name, 'material', price, 'nugget', c, desc, { c2: Rr.paper[4], tags: ['bar', 'material'] });
}
export const GEMS = [['topaz', 'Topaz', 90, Rr.butter[2], 2, 'A honey-yellow gem.'], ['aquamarine', 'Aquamarine', 150, Rr.sky[3], 2, 'Sea-blue and clear.'], ['ruby', 'Ruby', 250, Rr.ribbon[2], 3, 'Deep red, like a lantern.'], ['emerald', 'Emerald', 250, Rr.forest[3], 3, 'Green as the shrine forest.'], ['diamond', 'Diamond', 500, Rr.paper[4], 4, 'It throws tiny rainbows.'], ['star_shard', 'Star shard', 800, Rr.lilac[4], 5, 'A shard of crystallised starlight from the deepest floors.']];
for (const [k, name, price, c, rarity, desc] of GEMS) {
  item('min_' + k, name, 'mineral', price, 'gem', c, desc, { c2: Rr.paper[4], rarity, tags: ['mineral', 'gem', k] });
  register('collectible', 'min_' + k, { item: 'min_' + k, kind: 'mineral', where: ['mine'], rarity });
}

// Tools
const tool = (id, name, buy, shape, c, desc, tier, tags) => register('item', id, { name, cat: 'tool', price: buy ? Math.round(buy * 0.45 / 5) * 5 : 150 * tier, desc, tier, tags: ['tool', ...tags], icon: itemIcon(shape, { c }) });
tool('tool_pickaxe', 'Pickaxe', 600, 'tool', Rr.metal[2], 'A plain pickaxe. 3 energy a swing; copper and coal break in one hit.', 1, ['mining']);
tool('tool_pickaxe_2', 'Copper pickaxe', 0, 'tool', Rr.hairGinger[2], 'Upgraded: 2 energy a swing and one hit fewer on hard rock. Can break silver.', 2, ['mining']);
tool('tool_pickaxe_3', 'Star pickaxe', 0, 'tool', Rr.butter[3], 'Upgraded: 1 energy a swing and two hits fewer on hard rock. Can break star-gold.', 3, ['mining']);
tool('tool_pan', 'Panning dish', 350, 'plate', Rr.metal[3], 'A shallow dish for sifting shining bits from the water.', 1, ['panning']);
tool('tool_pan_2', 'Iron panning dish', 0, 'plate', Rr.charcoal[3], 'Upgraded: finds rare things more often and costs less energy.', 2, ['panning']);
