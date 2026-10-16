// Wild Places slice (sv2_wild): save slice, items, fish, buffs and small shared helpers.
//
// Save data: game.state.sv2_wild = { woods, seen, yui, guild, depths, fg }.
// Items added: forage_* rare woodland finds, mat_hardwood / mat_owl_feather / mat_tanuki_leaf / mat_star_fragment, potion_* brews,
// book_star_* lore books (skillBook, read via economy readBook), cloth_* boots and rings, tool_lantern_* guild lanterns,
// ore_starfall / ore_iridescent_geode / min_prism_shard from Starfall Depths.
// Fish (registered in the hobbies fish registry): fish_moss_carp, fish_amber_loach, fish_lantern_trout, fish_spirit_koi (map hoshi_woods).
// Events emitted: woodsEntered, critterSeen { id }, potionBrewed { id }, bountyDone { id }, starfallFloor { depth, best }, starRain, ruinsSolved.
import { register, get } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { BUFFS } from '../hobbies/common.js';
import { readBook } from '../economy/items.js';

register('stateSlice', 'sv2_wild', {
  default: () => ({
    woods: { day: 0, taken: {}, stumps: {}, chopped: 0, found: 0, lit: [], solved: false, hops: 0 },
    seen: {},
    yui: { req: {}, brewed: {}, potions: 0, met: 0 },
    guild: { claimed: {}, rank: 0, rings: [], boots: '', cracked: 0 },
    depths: { floor: 0, best: 0, day: 0, broken: {}, ladders: {}, gone: {}, rewards: {}, elev: 0, rain: { at: -1, nodes: [], got: {} }, runs: 0, dust: 0 },
    fg: { claimed: {} },
  }),
});
export const W2 = (game) => game.state.sv2_wild;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const seeIt = (game, id) => { const s = W2(game).seen; if (!s[id]) { s[id] = 1; game.bus.emit('critterSeen', { id }); return true; } s[id]++; return false; };

function item(id, name, cat, price, shape, c, desc, extra = {}) {
  const { c2, c3, ...rest } = extra;
  register('item', id, { name, cat, price, desc, icon: itemIcon(shape, { c, c2, c3 }), ...rest });
}

// ---------------------------------------------------------------- woodland forage (prefix forage_)
export const WOODS_FORAGE = [
  ['fiddlehead', 'Fiddlehead fern', ['spring'], 'leafy', Rr.mint[2], Rr.forest[3], 70, 12, 2, 'A curled green fern frond from the shady woods. Crisp and nutty.'],
  ['star_berry', 'Star berry', ['summer'], 'berry', Rr.sky[3], Rr.lilac[3], 85, 14, 3, 'Blue-purple berries that glow faintly after dark.'],
  ['glow_cap', 'Glow cap', ['autumn'], 'mushroom', Rr.mint[1], Rr.paper[4], 110, 10, 3, 'A mushroom with a soft green glow under the cap. Do not eat it raw.'],
  ['frost_fern', 'Frost fern', ['winter'], 'leafy', Rr.sky[2], Rr.paper[4], 90, 10, 3, 'A fern rimed with ice that never quite melts.'],
  ['moon_herb', 'Moon herb', ['spring', 'summer', 'autumn', 'winter'], 'flower', Rr.lilac[3], Rr.paper[4], 120, 8, 4, 'Only opens at night. Madame Yui swears by it.'],
  ['wild_ginseng', 'Wild ginseng', ['spring', 'summer', 'autumn', 'winter'], 'root', Rr.sand[3], Rr.wood[2], 260, 25, 5, 'A gnarled root that looks like a tiny sleeping person. Very rare.'],
];
for (const [k, name, seasons, shape, c, c2, price, energy, rarity, desc] of WOODS_FORAGE) {
  item('forage_' + k, name, 'crop', price, shape, c, desc, { c2, seasons, hab: 'wood', rarity, tags: ['forage', k, 'woods'], energy, mood: 1 });
}
if (!get('item', 'mat_hardwood')) item('mat_hardwood', 'Hardwood', 'material', 90, 'box', Rr.woodDark[2], 'Dense dark wood from the stumps of Hoshi Woods. Tobias would love it.', { c2: Rr.wood[2], tags: ['wood', 'material'] });
item('mat_owl_feather', 'Owl feather', 'material', 55, 'feather', Rr.wood[3], 'A soft barred feather. It makes no sound at all.', { c2: Rr.paper[3], tags: ['feather', 'material'] });
item('mat_tanuki_leaf', 'Tanuki leaf', 'material', 65, 'leafy', Rr.forest[2], 'A leaf the tanuki used for a hat. It still smells of mischief.', { c2: Rr.forest[3], tags: ['leaf', 'material'] });
item('mat_star_fragment', 'Star fragment', 'material', 140, 'star', Rr.butter[3], 'A little shard that fell during a star rain. Warm to hold.', { c2: Rr.paper[4], tags: ['star', 'material'] });
item('ore_starfall', 'Starfall ore', 'material', 190, 'nugget', Rr.lilac[3], 'Violet ore that rings like a bell. Only found in Starfall Depths.', { c2: Rr.butter[3], tags: ['ore', 'starfall'] });
item('ore_iridescent_geode', 'Iridescent geode', 'mineral', 160, 'geode', Rr.lilac[2], 'It shimmers every colour at once. Captain Marlow can crack it for 120 coins.', { c2: Rr.mint[2], tags: ['geode'] });
item('min_prism_shard', 'Prism shard', 'mineral', 900, 'gem', Rr.lilac[4], 'Light splits into a rainbow inside it. The rarest thing in the mines.', { c2: Rr.paper[4], rarity: 5, tags: ['mineral', 'gem', 'prism'] });
register('collectible', 'min_prism_shard', { item: 'min_prism_shard', kind: 'mineral', where: ['mine'], rarity: 5 });
item('forage_ruin_blossom', 'Ruin blossom', 'crop', 150, 'flower', Rr.sakura[2], 'A pale blossom that grows only between the old shrine stones.', { c2: Rr.paper[4], seasons: ['spring', 'summer', 'autumn', 'winter'], hab: 'wood', rarity: 4, tags: ['forage', 'ruin', 'woods'], energy: 10, mood: 2 });

// ---------------------------------------------------------------- potions
export const POTIONS = {
  potion_energy: { name: 'Energy tonic', price: 220, shape: 'bottle', c: Rr.butter[2], c2: Rr.coral[2], desc: 'Sweet and bitter. Restores 60 energy at once.', brew: [[['forage_wild_berry', 'forage_wild_grape', 'forage_star_berry', 'forage_chestnut'], 2], [['forage_moon_herb', 'forage_fiddlehead', 'forage_frost_fern', 'forage_snow_yam'], 1]], hint: '2 berries or nuts + 1 fern or moon herb' },
  potion_luck: { name: 'Luck draught', price: 380, shape: 'bottle', c: Rr.lilac[3], c2: Rr.paper[4], desc: 'Glimmers like a lucky star. Adds to today\'s luck and attracts rare finds for a while.', brew: [[['forage_star_berry', 'forage_glow_cap', 'forage_matsutake', 'forage_camellia'], 1], [['forage_wild_ginseng', 'forage_moon_herb'], 1], [['mat_stardust'], 1]], hint: 'a star berry or glow cap + moon herb or ginseng + dust fluff' },
  potion_swift: { name: 'Swiftness brew', price: 240, shape: 'bottle', c: Rr.mint[2], c2: Rr.sky[2], desc: 'Tastes of mint and wind. Your feet feel light for four hours.', brew: [[['forage_bamboo_shoot', 'forage_fiddlehead', 'forage_holly', 'forage_leek', 'forage_dandelion'], 2], [['mat_owl_feather', 'mat_tanuki_leaf'], 1]], hint: '2 green shoots + an owl feather or tanuki leaf' },
  potion_tea: { name: 'Moon tea', price: 180, shape: 'cup', c: Rr.lilac[3], c2: Rr.paper[4], desc: 'A cup of calm. Lifts your mood by 25 and restores 25 energy.', brew: [[['forage_moon_herb'], 1], [['forage_dandelion', 'forage_camellia', 'forage_crocus', 'forage_hibiscus', 'forage_shiso', 'forage_ruin_blossom'], 1]], hint: 'a moon herb + a flower or shiso' },
  potion_night: { name: 'Night-sight elixir', price: 260, shape: 'bottle', c: Rr.navy[3], c2: Rr.butter[3], desc: 'Dark places look soft and golden for three hours. Foraging at night turns up more.', brew: [[['forage_glow_cap', 'forage_wild_mushroom', 'forage_matsutake'], 2], [['forage_moon_herb'], 1]], hint: '2 mushrooms + 1 moon herb' },
};
for (const [id, p] of Object.entries(POTIONS)) item(id, p.name, 'food', p.price, p.shape, p.c, p.desc, { c2: p.c2, tags: ['potion'], useLabel: 'Drink', use: (g) => drinkPotion(g, id) });
export function drinkPotion(game, id) {
  game.sfx('pour'); game.stat('potionsDrunk');
  if (id === 'potion_energy') { game.addEnergy(60); game.toast('Energy tonic: +60 energy', 'i_energy'); }
  else if (id === 'potion_luck') { game.addBuff('lucky', 180); if (game.svLuck) game.svLuck(12); game.toast('Luck draught: feeling lucky!', 'i_star'); }
  else if (id === 'potion_swift') game.addBuff('swift', 240);
  else if (id === 'potion_night') game.addBuff('night_sight', 180);
  else if (id === 'potion_tea') { game.addMood(25); game.addEnergy(25); game.toast('Moon tea: warm and calm. +25 mood, +25 energy', 'heart'); }
  return false;
}
BUFFS.night_sight = { name: 'Night sight', desc: 'Dark places look golden, more night forage', icon: 'i_star' };

// ---------------------------------------------------------------- books (star-lore, skillBook pattern from economy)
export const LORE = [
  ['book_star_lore_wood', 'Star lore: whispering woods', 'foraging', 80, 1100, Rr.forest[2], 'Yui\'s notes on ferns, mushrooms and which ones hum at night.'],
  ['book_star_lore_stone', 'Star lore: the hum of stone', 'mining', 80, 1100, Rr.stone[3], 'Where the deep rocks sing and how to listen.'],
  ['book_star_lore_tide', 'Star lore: moon and tide', 'fishing', 80, 1000, Rr.sky[3], 'Fish bite by the moon. Page 12 has a chart.'],
  ['book_star_lore_hearth', 'Star lore: hearth charms', 'homemaking', 70, 900, Rr.coral[2], 'Little spells for warm rooms: salt, thyme and a kind word.'],
  ['book_star_lore_sky', 'Star lore: the lantern signs', 'study', 90, 1300, Rr.navy[2], 'The old constellations and what they mean for exams.'],
];
for (const [id, name, skill, xp, price, c, desc] of LORE) {
  item(id, name, 'book', price, 'book', c, desc, { tags: ['book', 'lore'], skillBook: { skill, xp }, useLabel: 'Read', use: (g) => readBook(g, id) });
}

// ---------------------------------------------------------------- guild gear
item('tool_lantern_guild', 'Guild lantern', 'tool', 700, 'tool', Rr.butter[2], 'Carried in your bag, it saves a little energy when you swing in the mines (10% of swings are free).', { c2: Rr.coral[2], tags: ['tool', 'lantern'], tier: 1 });
item('tool_lantern_star', 'Star lantern', 'tool', 1800, 'tool', Rr.lilac[3], 'A lantern lit by a star fragment. 20% of mine swings are free and dust sprites cannot tickle you.', { c2: Rr.butter[3], tags: ['tool', 'lantern'], tier: 2 });
item('cloth_boots_trail', 'Trail boots', 'misc', 900, 'shirt', Rr.wood[2], 'Sturdy boots. Wear them: 12% of anything that costs energy costs nothing.', { c2: Rr.woodDark[2], tags: ['boots', 'gear'], useLabel: 'Wear', use: (g) => wearBoots(g, 'cloth_boots_trail') });
item('cloth_boots_feather', 'Feather boots', 'misc', 2400, 'shirt', Rr.sky[3], 'Light as a gull. Wear them: 25% of anything that costs energy costs nothing.', { c2: Rr.paper[4], tags: ['boots', 'gear'], useLabel: 'Wear', use: (g) => wearBoots(g, 'cloth_boots_feather') });
export const RINGS = {
  cloth_ring_luck: ['Hoshi Ring of Luck', 'A thin silver band with a tiny star. Wear it: +6 luck every morning.', Rr.butter[3], 1200],
  cloth_ring_ore: ['Hoshi Ring of Ore', 'A heavy copper band. Wear it: 20% chance of an extra ore from mined rocks.', Rr.hairGinger[2], 1500],
  cloth_ring_forage: ['Hoshi Ring of Moss', 'A green jade band. Wear it: 30% chance of a double forage pick.', Rr.forest[3], 1400],
};
for (const [id, [name, desc, c, price]] of Object.entries(RINGS)) item(id, name, 'misc', price, 'coin', c, desc, { c2: Rr.paper[4], tags: ['ring', 'gear'], useLabel: 'Wear', use: (g) => toggleRing(g, id) });
export const ringSlots = (game) => 1 + (game.flag('sw_rank2') ? 1 : 0) + (game.flag('sw_rank4') ? 1 : 0);
export const wearing = (game, id) => W2(game).guild.rings.includes(id);
export function toggleRing(game, id) {
  const gs = W2(game).guild, name = RINGS[id][0];
  if (gs.rings.includes(id)) { gs.rings = gs.rings.filter((r) => r !== id); game.toast(`Took off the ${name}`, 'i_star'); return true; }
  if (gs.rings.length >= ringSlots(game)) { game.toast(`No free ring slot (${gs.rings.length}/${ringSlots(game)}). Take another ring off first.`); return true; }
  gs.rings.push(id); game.sfx('chime'); game.toast(`Wearing the ${name} (${gs.rings.length}/${ringSlots(game)} slots)`, 'i_star'); return true;
}
export function wearBoots(game, id) {
  const gs = W2(game).guild;
  gs.boots = gs.boots === id ? '' : id;
  game.toast(gs.boots ? `Wearing ${id === 'cloth_boots_trail' ? 'trail boots' : 'feather boots'}` : 'Took the boots off', 'i_energy');
  return true;
}

// ---------------------------------------------------------------- hobbies fish (the woodland pond)
export const WOODS_FISH = [
  ['moss_carp', 'Moss carp', 'fish2', Rr.forest[2], Rr.forest[1], ['spring', 'summer', 'autumn'], 'day', 'any', 2, [30, 60], 180, 'A fat carp with a coat of green moss on its back.'],
  ['amber_loach', 'Amber loach', 'eel', Rr.hairGinger[2], Rr.butter[2], ['spring', 'autumn', 'winter'], 'any', 'any', 2, [10, 22], 150, 'A honey-coloured loach that hides under the pond leaves.'],
  ['lantern_trout', 'Lantern trout', 'fish2', Rr.butter[3], Rr.mint[2], ['summer', 'autumn', 'winter'], 'night', 'any', 4, [25, 45], 420, 'Its spots glow like a string of tiny lanterns.'],
  ['spirit_koi', 'Spirit koi', 'fish2', Rr.paper[4], Rr.lilac[3], ['spring', 'summer', 'autumn', 'winter'], 'any', 'rain', 5, [60, 100], 1300, 'A pale legend of the hidden pond. It only rises when it rains.'],
];
for (const [k, name, shape, c, c2, seasons, times, weather, rarity, size, price, desc] of WOODS_FISH) {
  const id = 'fish_' + k;
  item(id, name, 'fish', price, shape, c, desc, { c2, tags: ['fish', k, ...(rarity >= 5 ? ['legend'] : [])], rarity });
  register('fish', id, { item: id, name, maps: ['hoshi_woods'], seasons, times, weather, rarity, size, legend: rarity >= 5, shape, c });
}
