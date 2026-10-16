// Orchard, cellar and water farming: save slice, items, recipes, the keg machine and shop stock.
// Save data: game.state.sv2_orchard
//   trees:  [{ id, kind (fruit kind | oak maple pine | stump), map, x, y, born, fruit (0-3 ripe), hits, static?, key?, tap?: { out, left, ready } }]
//   things: [{ id, kind: log|pot|pond, map, x, y, ... }]   cut: { 'map:x,y': true } static trees that were felled
//   casks:  [null | { item, q (0-3), age (days, may be fractional) }] x14   cellar: tier 1-3   report: [lines]
// Registry kinds used: 'svMachine' (the keg, handled by sv_farm's machine code), items, 'craft', 'stateSlice'.
import { register, get, all } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { FISH } from '../hobbies/data.js';
import { UPGRADES } from '../sv_explore/tools.js';

export const SV2 = (game) => game.state.sv2_orchard;
register('stateSlice', 'sv2_orchard', {
  default: () => ({ trees: [], nextT: 1, things: [], nextH: 1, cut: {}, casks: Array(14).fill(null), cellar: 1, report: [], pondSeen: {} }),
});

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
// Fruit trees. blossom/leaf colours are used by the art; seasons = when it bears fruit.
export const FRUIT = {
  cherry: { name: 'Cherry', seasons: ['spring'], item: 'ing_cherry', price: 55, buy: 850, c: '#c42a48', desc: 'Pink blossoms in early spring, then bright cherries.' },
  plum: { name: 'Plum', seasons: ['summer'], item: 'ing_plum', price: 48, buy: 650, c: '#8a4a9c', desc: 'A hardy tree with sweet purple plums in summer.' },
  peach: { name: 'Peach', seasons: ['summer'], item: 'ing_peach', price: 45, buy: 700, c: '#f5946e', desc: 'Fuzzy peaches all through summer.' },
  apple: { name: 'Apple', seasons: ['autumn'], item: 'ing_apple', price: 30, buy: 600, c: '#d8383a', desc: 'Crisp red apples in autumn.' },
  persimmon: { name: 'Persimmon', seasons: ['autumn'], item: 'ing_persimmon', price: 62, buy: 800, c: '#f08a22', desc: 'Orange kaki fruit hanging on bare autumn branches.' },
  orange: { name: 'Orange', seasons: ['summer', 'autumn'], item: 'ing_orange', price: 58, buy: 900, c: '#f4a424', desc: 'Evergreen. Fruits in summer and autumn, and all year once the greenhouse is built.' },
};
export const FRUIT_OF = Object.fromEntries(Object.entries(FRUIT).map(([k, f]) => [f.item, k]));
export const WILD = {
  oak: { name: 'Oak', tap: 'art_oak_resin', days: 7, n: 'Oak' },
  maple: { name: 'Maple', tap: 'art_maple_syrup', days: 9, n: 'Maple' },
  pine: { name: 'Pine', tap: 'art_pine_tar', days: 5, n: 'Pine' },
};
export const TREE_MAPS = ['yard', 'backyard'];
export const GROW_DAYS = 28, YEAR_DAYS = 112;

const mk = (id, name, cat, shape, c, price, desc, o = {}) => register('item', id, { name, desc, cat, price, icon: itemIcon(shape, { c, c2: o.c2 }), tags: o.tags || [cat], ...(o.x || {}) });
const keep = (id, ...a) => { if (!get('item', id)) mk(id, ...a); };

// ---------------------------------------------------------------- tools and wood
mk('tool_axe', 'Axe', 'tool', 'tool', Rr.metal[2], 400, 'Chops wild trees, stumps and old fruit trees. Swings cost energy.', { tags: ['tool', 'forest'], x: { tier: 1, buy: 700 } });
mk('tool_axe_2', 'Copper axe', 'tool', 'tool', Rr.hairGinger[2], 1800, 'Fells a tree in about two thirds of the swings.', { tags: ['tool', 'forest'], x: { tier: 2 } });
mk('tool_axe_3', 'Iron axe', 'tool', 'tool', Rr.charcoal[3], 4500, 'Half the swings. Trees fall like dominoes.', { tags: ['tool', 'forest'], x: { tier: 3 } });
mk('mat_hardwood', 'Hardwood', 'material', 'furniture', Rr.woodDark[2], 110, 'Dense, dark wood from old trunks. Good for kegs, ponds and casks.', { tags: ['material', 'wood'], x: { buy: 320 } });
if (Array.isArray(UPGRADES)) {
  UPGRADES.push({ from: 'tool_axe', to: 'tool_axe_2', bars: { mat_bar_copper: 2 }, coins: 700 }, { from: 'tool_axe_2', to: 'tool_axe_3', bars: { mat_bar_iron: 3 }, coins: 2000 });
}

// ---------------------------------------------------------------- fruit, saplings, tree products
const ING = (id, name, shape, c, price, desc, season) => keep(id, name, 'food', shape, c, price, desc, { tags: ['ingredient', 'fruit', 'sweet', 'orchard'], x: { energy: 9, mood: 1, seasons: [season] } });
ING('ing_cherry', 'Cherry', 'berry', '#c42a48', 55, 'Shiny red cherries with a little stalk.', 'spring');
ING('ing_plum', 'Plum', 'fruit', '#8a4a9c', 48, 'Sweet and slightly sour purple plums.', 'summer');
ING('ing_orange', 'Orange', 'fruit', '#f4a424', 58, 'A sunny orange from the home orchard.', 'summer');
ING('ing_persimmon', 'Persimmon', 'fruit', '#f08a22', 62, 'Soft, honey-sweet kaki.', 'autumn');
keep('ing_shiitake', 'Shiitake', 'food', 'mushroom', Rr.wood[2], 72, 'Meaty caps grown on a log in the yard.', { tags: ['ingredient', 'mushroom', 'forage', 'orchard'], x: { energy: 10, mood: 1 } });
keep('ing_maitake', 'Maitake', 'food', 'mushroom', Rr.paper[2], 96, 'Ruffled hen-of-the-woods. A treat in autumn stews.', { tags: ['ingredient', 'mushroom', 'forage', 'orchard'], x: { energy: 12, mood: 2 } });
for (const [k, f] of Object.entries(FRUIT)) {
  mk(`sapling_${k}`, `${f.name} sapling`, 'misc', 'plant', f.c, 150, `${f.desc} Plant it facing open ground in the yard or back yard (clear on all 8 sides). Fruits after 28 days.`, { tags: ['sapling', 'garden'], x: { buy: f.buy, use: (g) => !(g.sv2Plant && g.sv2Plant(k)) } });
}
mk('art_maple_syrup', 'Maple syrup', 'food', 'bottle', Rr.hairGinger[3], 240, 'Amber syrup tapped from a maple. Pancakes beg for it.', { c2: Rr.wood[1], tags: ['artisan', 'sweet', 'syrup'], x: { energy: 16, mood: 3 } });
mk('art_oak_resin', 'Oak resin', 'material', 'amber', Rr.hairGinger[2], 160, 'Sticky golden resin from an oak tapper.', { tags: ['material', 'artisan', 'resin'] });
mk('art_pine_tar', 'Pine tar', 'material', 'bottle', Rr.charcoal[3], 120, 'Dark, smoky tar from pine bark. Smells like a campfire.', { tags: ['material', 'artisan', 'resin'] });
for (const [k, f] of Object.entries(FRUIT)) {
  keep(`art_jam_${k}`, `${f.name} jam`, 'food', 'jar', f.c, Math.round(f.price * 2 + 50), `Bubbling ${f.name.toLowerCase()} jam, put up in a jar.`, { c2: Rr.paper[4], tags: ['artisan', 'jam', 'sweet'], x: { energy: 14, mood: 3 } });
}

// ---------------------------------------------------------------- keg goods: wine, juice, brews
const fruitCrop = (id) => { const c = get('crop', id), it = get('item', id); return !!c && !c.flower && !!it && (it.tags || []).includes('fruit'); };
const vegCrop = (id) => { const c = get('crop', id), it = get('item', id); return !!c && !c.flower && !!it && (it.tags || []).includes('veg') && !(it.tags || []).includes('flower'); };
const wineName = (n) => `${n} wine`;
for (const [k, f] of Object.entries(FRUIT)) keep(`art_wine_${k}`, wineName(f.name), 'food', 'bottle', f.c, f.price * 3 + 40, `${f.name} wine. Better with age: leave it in a cellar cask.`, { c2: Rr.paper[4], tags: ['artisan', 'wine', 'drink'], x: { energy: 12, mood: 4 } });
for (const cr of all('crop')) {
  const k = cr.id.slice(5), base = get('item', cr.item); if (!base) continue;
  if (fruitCrop(cr.id)) keep(`art_wine_${k}`, wineName(cr.name || base.name), 'food', 'bottle', cr.c || Rr.ribbon[2], base.price * 3 + 40, `${base.name} wine from the keg. Cask aging improves it.`, { c2: Rr.paper[4], tags: ['artisan', 'wine', 'drink'], x: { energy: 12, mood: 4 } });
  else if (vegCrop(cr.id)) keep(`art_juice_${k}`, `${base.name} juice`, 'food', 'bottle', cr.c || Rr.mint[2], Math.round(base.price * 2.25 + 20), `Fresh ${base.name.toLowerCase()} juice. Healthy and surprisingly good.`, { c2: Rr.paper[4], tags: ['artisan', 'juice', 'drink'], x: { energy: 14, mood: 2 } });
}
mk('art_cold_brew', 'Cold brew', 'food', 'cup', Rr.woodDark[2], 170, 'Coffee steeped slowly in a keg. Smooth as silk.', { tags: ['artisan', 'drink', 'coffee'], x: { energy: 20, mood: 3 } });
mk('art_tea_cold', 'Pale green tea', 'food', 'cup', Rr.mint[2], 150, 'Chilled kegged tea, pale and grassy.', { tags: ['artisan', 'drink', 'tea'], x: { energy: 14, mood: 3 } });
mk('art_mead', 'Honey mead', 'food', 'bottle', Rr.butter[2], 380, 'Golden mead brewed from honey. Gets smoother with age.', { c2: Rr.wood[2], tags: ['artisan', 'drink', 'wine'], x: { energy: 14, mood: 4 } });

// ---------------------------------------------------------------- water farming goods
for (const [id, n, p, d, c] of [['fish_crab', 'Mud crab', 130, 'A feisty crab from the pot. Mind the claws.', Rr.brick[2]], ['fish_shrimp', 'Sweet shrimp', 75, 'Sweet, pink and wiggly.', Rr.coral[3]], ['fish_lobster', 'Spiny lobster', 400, 'A prize from the deep pots.', Rr.ribbon[1]], ['fish_clam', 'Clam', 65, 'A fat clam that squirts when you poke it.', Rr.sand[3]], ['fish_mussel', 'Mussel', 50, 'Dark blue shells, creamy inside.', Rr.navy[2]]]) {
  mk(id, n, 'fish', id === 'fish_lobster' || id === 'fish_crab' ? 'fish2' : 'shell', c, p, d, { c2: Rr.paper[3], tags: ['fish', 'shellfish'] });
}
for (const [k, name, shape, c, c2, , , , , rarity, , price] of FISH) {
  mk(`art_roe_${k}`, `${name} roe`, 'food', 'jar', c, Math.round(price * 0.6 + 30), `Glistening ${name.toLowerCase()} roe from the back yard fish pond. Ages into caviar in a cellar cask.`, { c2: Rr.coral[3], tags: ['artisan', 'roe', 'seafood'], x: { energy: 10, mood: 2 } });
  void shape; void c2; void rarity;
}

// ---------------------------------------------------------------- placeable gear
const MACH = {
  tapper: ['Tree tapper', 'Face a mature oak, maple or pine and use it. Collects resin, tar or syrup over days.', 'bottle', 320, 900],
  mushroom_log: ['Mushroom log', 'Place it in the yard. Grows shiitake and maitake slowly, better in spring and autumn.', 'furniture', 200, 500],
  crab_pot: ['Crab pot', 'Face water at the harbour or beach and use it. Checked daily for shellfish. Add bait for better catches.', 'box', 150, 700],
  fish_pond: ['Fish pond', 'Needs a clear 2x2 patch in the back yard. Stock fish you caught: they breed and make roe.', 'furniture', 1200, 4500],
  keg: ['Keg', 'Place it in a yard. Turns fruit into wine, vegetables into juice, and brews tea, coffee and mead.', 'furniture', 420, 1200],
};
export const MACH_NAME = Object.fromEntries(Object.entries(MACH).map(([k, v]) => [k, v[0]]));
for (const [k, [name, desc, shape, price, buy]] of Object.entries(MACH)) {
  const id = `mach_${k}`;
  register('item', id, { name, desc, cat: 'misc', price, buy, tags: ['machine', 'orchard'], icon: itemIcon(shape, { c: Rr.wood[2], c2: Rr.metal[3] }),
    use: (g) => (k === 'keg' ? (g.svPlace ? !g.svPlace('keg') : true) : (g.sv2Place ? !g.sv2Place(k) : true)) });
}
const rec = (id, name, ing, out, skill = 0, n = 1) => register('craft', id, { name, ingredients: ing, out, n, skill });
rec('craft_tool_axe', 'Axe', { mat_wood: 2, mat_wire: 2 }, 'tool_axe', 1);
rec('craft_mach_tapper', 'Tree tapper', { mat_wood: 2, mat_wire: 3, mat_hardwood: 1 }, 'mach_tapper', 2);
rec('craft_mach_mushroom_log', 'Mushroom log', { mat_hardwood: 2, mat_wood: 1 }, 'mach_mushroom_log', 1);
rec('craft_mach_crab_pot', 'Crab pot', { mat_wood: 3, mat_string: 2, mat_wire: 1 }, 'mach_crab_pot', 1);
rec('craft_mach_fish_pond', 'Fish pond', { mat_wood: 8, mat_clay: 4, mat_hardwood: 4, mat_glass: 2 }, 'mach_fish_pond', 4);
rec('craft_mach_keg', 'Keg', { mat_wood: 4, mat_wire: 3, mat_hardwood: 2 }, 'mach_keg', 3);

// The keg is a regular sv_farm artisan machine (placing, loading, bubbles, star quality all come from there).
register('svMachine', 'keg', {
  name: 'Keg', days: 6, empty: 'Needs fruit, vegetables, tea, coffee or honey.', craft: 'mat_wood*4 mat_wire*3 mat_hardwood*2', lvl: 3,
  rec: (id) => {
    let r = null;
    if (FRUIT_OF[id]) r = { out: `art_wine_${FRUIT_OF[id]}`, days: 6 };
    else if (fruitCrop(id)) r = { out: `art_wine_${id.slice(5)}`, days: 6 };
    else if (vegCrop(id)) r = { out: `art_juice_${id.slice(5)}`, days: 4 };
    else if (id === 'ing_tea' || id === 'ing_matcha') r = { out: 'art_tea_cold', days: 3 };
    else if (id === 'ing_coffee') r = { out: 'art_cold_brew', days: 3 };
    else if (id.startsWith('art_honey_') || id === 'ing_honey') r = { out: 'art_mead', days: 5 };
    return r && get('item', r.out) ? r : null;
  },
});
// The preserves jar also takes tree fruit.
const jar = get('svMachine', 'jar');
if (jar && typeof jar.rec === 'function') { const old = jar.rec; jar.rec = (id) => (FRUIT_OF[id] ? { out: `art_jam_${FRUIT_OF[id]}`, days: 3 } : old(id)); }

// ---------------------------------------------------------------- shop stock (arrays are read at open time)
const push = (shop, ...ids) => { const s = get('shop', shop); if (s && Array.isArray(s.stock)) for (const id of ids) if (!s.stock.includes(id)) s.stock.push(id); };
push('mart', ...Object.keys(FRUIT).map((k) => `sapling_${k}`));
push('woodworks', 'tool_axe', 'mat_hardwood', 'mach_tapper', 'mach_mushroom_log', 'mach_keg');
push('bait', 'mach_crab_pot', 'mach_fish_pond');
