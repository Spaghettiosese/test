// Lantern Isle (shore, ruined observatory, tidal cave, second lighthouse, walled garden) and Coral Atoll (beach, lagoon, bungalow resort, night market).
import { grid, prop, deckObjects, isle, house, room, inn } from './lib.js';
import { hasBoat } from './sea.js';
import { bottleObj } from './acts.js';
import { tideAt } from '../coast/tides.js';

const boatWarp = (to) => ({ to, locked: (g) => !hasBoat(g) || g.weather === 'storm', lockedText: 'You would need a boat to launch from here. The berth is at Hoshimori Harbour.' });
const glowMoss = (x, y) => ({ spr: 'sv4_moss', x, y, solid: false, shadow: 0, sprFn: () => 'sv4_moss_lit', light: { kind: 'shrine' }, use: 'sv4_moss' });

// =============================================================== LANTERN ISLE SHORE (44x28)
{
  const G = grid(44, 28, '~');
  G.rect(10, 2, 32, 24, '.').rect(10, 18, 32, 8, 's').rect(10, 2, 3, 24, 's').rect(10, 2, 32, 3, 'T').rect(24, 2, 2, 3, '.').rect(2, 12, 9, 3, 'p').rect(26, 14, 8, 4, ':');
  isle('lantern_isle_shore', {
    name: 'Lantern Isle', music: 'beach',
    legend: { '~': 'ocean', '.': 'meadow', s: 'sand', T: 'coast_wood', p: 'coast_pierwater', ':': 'dirt' },
    rows: G.rows(),
    objects: [
      ...deckObjects(G),
      prop('sv4_ferry_sign', 9, 11, { use: 'sv4_ferry_back', shadow: 8 }),
      prop('sv4_arch_garden', 14, 6, { w: 2, solid: true, shadow: 24 }),
      prop('sv4_cave_arch', 34, 19, { w: 3, h: 2, solid: true, shadow: 40 }),
      prop('sv4_tower', 38, 12, { w: 3, h: 1, shadow: 44, light: { kind: 'lamp', y: -190 } }),
      prop('sv4_ruin_pillar', 20, 8, { shadow: 10 }), prop('sv4_ruin_pillar', 28, 9, { shadow: 10 }), prop('sv4_ruin_wall', 22, 6, { w: 2, shadow: 20 }), prop('sv4_boulder', 18, 14, { w: 1, shadow: 14 }),
      prop('sv4_palm', 12, 21, { shadow: 8 }), prop('sv4_palm', 30, 22, { shadow: 8 }), prop('sv4_island_tree', 16, 10, { shadow: 12 }), prop('sv4_island_tree', 31, 7, { shadow: 12 }),
      prop('sv4_bench_s', 18, 18, { use: 'bench', shadow: 12 }), prop('sv4_boat_small', 4, 16, { w: 2 }), prop('sv4_crate_fish', 8, 14, { shadow: 10 }),
      { spr: 'sv4_post_sign', x: 22, y: 5, w: 1, h: 1, shadow: 6, interact: { label: 'Read the sign', run: (g) => g.say(null, null, 'North: the old observatory. East: the Lantern Tower. West: the walled garden (knock first). South-east: the tidal cave, safe at low tide only.') } },
      { spr: 'sv4_drift', x: 16, y: 23, solid: false, use: 'sv4_sea_glass' }, { spr: 'sv4_drift', x: 36, y: 24, solid: false, use: 'sv4_sea_glass' },
      bottleObj('lantern_isle_shore', 22, 24),
    ],
    warps: [
      { x: 24, y: 2, w: 2, enter: 'up', to: 'lantern_ruins:from_shore' },
      { x: 35, y: 21, enter: 'up', to: 'lantern_cave:from_shore' },
      { x: 39, y: 13, enter: 'up', to: 'lantern_tower:from_shore' },
      { x: 15, y: 7, enter: 'up', to: 'lantern_garden:from_shore' },
      { x: 2, y: 12, h: 3, ...boatWarp('seto_sea:from_lantern_isle_shore') },
    ],
    spawns: { default: [20, 16], from_ferry: [9, 13, 'right'], from_seto_sea: [3, 13, 'right'], from_ruins: [24, 5, 'down'], from_cave: [35, 23, 'down'], from_tower: [39, 15, 'down'], from_garden: [15, 8, 'down'] },
    spots: { ferry: [9, 12], picnic: [19, 17], glass_beach: [16, 24], arch: [15, 8], ruins_path: [24, 6], cave_mouth: [35, 22], tower_door: [39, 14], bench: [18, 19], crates: [8, 15], lookout: [30, 16] },
  });
}

// =============================================================== RUINS (30x22): the observatory and its gear console
{
  const G = grid(30, 22, 'T');
  G.rect(2, 3, 26, 18, '.').rect(13, 13, 4, 9, ':').rect(11, 12, 8, 2, ':');
  isle('lantern_ruins', {
    name: 'Old Observatory', music: 'night',
    legend: { T: 'coast_wood', '.': 'meadow', ':': 'dirt' },
    rows: G.rows(),
    objects: [
      prop('sv4_observatory', 10, 9, { w: 5, h: 1, shadow: 60, interact: { label: 'Look up at the dome', run: (g) => g.say(null, null, g.flag('seto_gears_done') ? 'The dome slit glows faintly. The gears inside turn in their sleep, counting stars.' : 'A great stone dome, cracked open like an egg. A slit in the roof points at nothing now. Perhaps the gears at its feet still remember what.') } }),
      prop('sv4_gear_console', 14, 11, { w: 2, use: 'sv4_gears', shadow: 24 }),
      prop('sv4_telescope_s', 20, 11, { use: 'sv4_telescope', shadow: 8 }),
      prop('sv4_ruin_pillar', 5, 8, { shadow: 10 }), prop('sv4_ruin_pillar', 24, 7, { shadow: 10 }), prop('sv4_ruin_wall', 3, 14, { w: 2, shadow: 20 }), prop('sv4_ruin_wall', 22, 15, { w: 2, shadow: 20 }),
      prop('sv4_boulder', 8, 17, { shadow: 14 }), prop('sv4_island_tree', 5, 4, { shadow: 12 }), prop('sv4_island_tree', 25, 4, { shadow: 12 }), prop('town_bush_flower', 18, 16),
      { spr: 'sv4_post_sign', x: 12, y: 15, w: 1, h: 1, shadow: 6, use: 'sv4_logbook' },
    ],
    warps: [{ x: 13, y: 21, w: 4, to: 'lantern_isle_shore:from_ruins' }],
    spawns: { default: [14, 18, 'up'], from_shore: [14, 19, 'up'] },
    spots: { console: [15, 13, 'up'], telescope: [21, 12], gate: [14, 19], logbook: [12, 16], ruins_view: [8, 12] },
  });
}

// =============================================================== TIDAL CAVE (28x18)
{
  const G = grid(28, 18, '#');
  G.rect(2, 3, 24, 13, '.').rect(5, 6, 6, 4, '~').rect(16, 8, 6, 4, '~').rect(12, 15, 4, 2, '.').rect(21, 4, 3, 3, ',');
  isle('lantern_cave', {
    name: 'Tidal Cave', outdoor: true, music: 'cave', dark: true, bg: '#14101e',
    legend: { '#': 'coast_cavewall', '.': 'coast_apron', ',': 'coast_apron', '~': 'ocean' },
    rows: G.rows(),
    objects: [
      glowMoss(4, 4), glowMoss(10, 12), glowMoss(14, 4), glowMoss(23, 13), glowMoss(7, 13), glowMoss(24, 8),
      prop('sv4_chest', 21, 4, { shadow: 14, sprFn: (g) => (g.flag('seto_chest_day') === g.day ? 'sv4_chest_open' : 'sv4_chest'), use: 'sv4_chest' }),
      prop('sv4_boulder', 2, 12, { shadow: 14 }), prop('sv4_boulder', 22, 15, { shadow: 14 }), prop('sv4_barrel', 12, 9, { shadow: 6, interact: { label: 'Old barrel', run: (g) => g.say(null, null, 'A barrel from some ship that did not make it. It is empty except for a sleeping hermit crab.') } }),
    ],
    warps: [{ x: 12, y: 17, w: 4, enter: 'down', to: 'lantern_isle_shore:from_cave' }],
    spawns: { default: [13, 14, 'up'], from_shore: [13, 15, 'up'] },
    spots: { pools: [8, 11], chest: [21, 7, 'up'], moss: [10, 11], entrance: [13, 15], ledge: [20, 6] },
    onEnter(g) { if (tideAt(g) !== 'low' && !g.flag('seto_cave_tide')) { g.setFlag('seto_cave_tide'); g.toast('The tide is coming in: the chest is under water until it ebbs', 'i_rain'); } },
  });
}

// =============================================================== TOWER (14x24 interior, three floors)
{
  const G = grid(14, 24, '#');
  G.rect(1, 2, 12, 6, '.').rect(1, 9, 12, 6, '.').rect(1, 16, 12, 7, '.').rect(6, 8, 2, 1, '.').rect(6, 15, 2, 1, '.').set(7, 23, 'd');
  inn('lantern_tower', {
    name: 'Lantern Tower', legend: { '#': 'int_wall_stone', '.': 'int_fl_stone', d: 'int_fl_door' }, rows: G.rows(), music: 'night',
    objects: [
      { spr: 'sv4_bed', x: 2, y: 17, w: 2, h: 1, shadow: 0, use: 'sv4_tower_bed' },
      { spr: 'sv4_table_s', x: 8, y: 18, w: 2, h: 1, shadow: 0, interact: { label: 'Keeper\'s table', run: (g) => g.say(null, null, 'A teapot with a knitted cosy shaped like a puffin. A log of every ship that has passed since 1952.') } },
      { spr: 'sv4_stairs_spiral', x: 6, y: 16, w: 2, h: 1, flat: true, solid: false },
      { spr: 'sv4_stairs_spiral', x: 6, y: 9, w: 2, h: 1, flat: true, solid: false },
      { spr: 'sv4_window_sea', x: 3, y: 10, w: 2, h: 1, shadow: 0, interact: { label: 'Look out', run: (g) => g.say(null, null, 'Halfway up, the island is a green coin in a blue plate. You can see the ferry\'s white scratch across the sea.') } },
      { spr: 'sv4_window_sea', x: 9, y: 10, w: 2, h: 1, shadow: 0, interact: { label: 'Look out', run: (g) => g.say(null, null, 'Far east, a low smudge: Coral Atoll. To the west, Tsubame\'s stilt houses. Home is a smudge too.') } },
      { spr: 'sv4_telescope_s', x: 3, y: 4, shadow: 6, use: 'sv4_tower_lamp' }, { spr: 'sv4_lantern_post', x: 9, y: 3, shadow: 6, light: { kind: 'lamp' }, use: 'sv4_tower_lamp' },
      { spr: 'sv4_shelf', x: 10, y: 17, w: 2, h: 1, shadow: 0, interact: { label: 'Keeper\'s shelf', run: (g) => g.say(null, null, 'Spare wicks, a jar of pressed sea-pinks and a tin labelled MORALE. It is full of biscuits.') } },
    ],
    warps: [{ x: 7, y: 23, enter: 'down', to: 'lantern_isle_shore:from_tower' }],
    spawns: { default: [7, 21, 'up'], from_shore: [7, 21, 'up'] },
    spots: { door: [7, 22], cot: [3, 18, 'up'], landing: [7, 12], lamp_room: [7, 5], table: [8, 19], window: [4, 11] },
  });
}

// =============================================================== WALLED GARDEN (24x18)
{
  const G = grid(24, 18, 'S');
  G.rect(1, 1, 22, 16, '.').rect(8, 7, 8, 4, 'p').rect(11, 11, 2, 7, ':').rect(11, 17, 2, 1, ':');
  isle('lantern_garden', {
    name: 'Walled Garden', music: 'home', gardenPlots: [8, 7, 8, 4],
    legend: { S: 'wall_stone', '.': 'meadow', p: 'town_plot', ':': 'dirt' },
    rows: G.rows(),
    objects: [
      prop('town_bush_flower', 2, 3, { w: 1 }), prop('town_bush', 5, 2), prop('town_bush_flower', 18, 3), prop('town_bush', 20, 8), prop('town_bush_flower', 3, 12), prop('town_bush', 19, 13), prop('sv4_island_tree', 4, 7, { shadow: 12 }), prop('sv4_island_tree', 19, 5, { shadow: 12 }),
      prop('sv4_bench_s', 6, 14, { use: 'bench', shadow: 12 }), prop('sv4_lantern_post', 9, 13, { shadow: 6, light: { kind: 'lantern' } }),
      { spr: 'town_bush_flower', x: 3, y: 4, w: 1, h: 1, shadow: 8, use: 'sv4_garden_pods' }, { spr: 'town_bush_flower', x: 20, y: 11, w: 1, h: 1, shadow: 8, use: 'sv4_garden_pods' }, { spr: 'town_bush', x: 14, y: 3, w: 1, h: 1, shadow: 8, use: 'sv4_garden_pods' },
    ],
    warps: [{ x: 11, y: 17, w: 2, enter: 'down', to: 'lantern_isle_shore:from_garden' }],
    spawns: { default: [11, 14, 'up'], from_shore: [11, 15, 'up'] },
    spots: { plots: [12, 12, 'up'], bench: [7, 14], pods: [4, 5], gate: [11, 16], tea: [15, 9] },
  });
}

// =============================================================== CORAL BEACH (56x30)
{
  const G = grid(56, 30, '~');
  G.rect(0, 5, 56, 25, 's').rect(26, 2, 4, 6, 'p').rect(0, 22, 56, 8, 's');
  isle('coral_beach', {
    name: 'Coral Beach', music: 'beach',
    legend: { '~': 'ocean', s: 'sand', p: 'coast_pierwater', w: 'ocean' },
    rows: G.rows(),
    objects: [
      ...deckObjects(G),
      ...(() => { const b = house('sv4_bar', 8, 11, { use: 'sv4_shop_bar' }), h = house('sv4_hut', 36, 9, { to: 'coral_hut_resort:from_beach', door: 2, glow: true }), st = house('sv4_store', 15, 21, { use: 'sv4_shop_resort' }); return [b.obj, h.obj, st.obj]; })(),
      prop('sv4_volley_net', 24, 15, { w: 3, use: 'sv4_volley', shadow: 40 }), prop('sv4_bonfire_logs', 44, 20, { w: 1, use: 'sv4_bonfire', shadow: 16, light: { kind: 'lantern' } }),
      prop('sv4_ferry_sign', 25, 7, { use: 'sv4_ferry_back', shadow: 8 }),
      prop('sv4_umbrella', 5, 16, { shadow: 12 }), prop('sv4_umbrella', 12, 17, { shadow: 12 }), prop('sv4_umbrella', 46, 14, { shadow: 12 }), prop('sv4_sun_lounger', 3, 18, { w: 2, solid: false }), prop('sv4_sun_lounger', 48, 17, { w: 2, solid: false }),
      prop('sv4_hammock', 42, 24, { w: 2, use: 'sv4_hammock', shadow: 0, solid: false }), prop('sv4_palm', 2, 8, { shadow: 8 }), prop('sv4_palm', 20, 9, { shadow: 8 }), prop('sv4_palm', 33, 7, { shadow: 8 }), prop('sv4_palm', 53, 10, { shadow: 8 }), prop('sv4_palm', 6, 26, { shadow: 8 }), prop('sv4_palm', 36, 26, { shadow: 8 }),
      prop('coast_dunegrass', 30, 20, { solid: false }), prop('coast_dunegrass', 11, 25, { solid: false }), prop('sv4_boat_small', 34, 4, { w: 2, solid: true }),
      prop('sv4_stool', 8, 14, { solid: false }), prop('sv4_stool', 10, 14, { solid: false }), prop('sv4_stool', 12, 14, { solid: false }),
      bottleObj('coral_beach', 20, 25),
    ],
    warps: [
      { x: 38, y: 10, enter: 'up', to: 'coral_hut_resort:from_beach' }, { x: 55, y: 14, h: 4, to: 'coral_lagoon:from_beach' }, { x: 26, y: 29, w: 4, to: 'coral_market:from_beach' },
      { x: 26, y: 1, w: 4, ...boatWarp('seto_sea:from_coral_beach') },
    ],
    spawns: { default: [27, 12], from_ferry: [27, 8, 'down'], from_seto_sea: [27, 3, 'down'], from_hut: [38, 11, 'down'], from_lagoon: [54, 15, 'left'], from_market: [27, 28, 'up'] },
    spots: { bar: [10, 13], volley: [26, 17], bonfire: [44, 22], dock: [27, 7], store: [16, 23], hut_door: [38, 11], lounge: [4, 19], hammock: [43, 25], shore: [14, 7], market_path: [27, 27] },
  });
}

// =============================================================== LAGOON (40x24)
{
  const G = grid(40, 24, '~');
  G.rect(0, 16, 40, 8, 's').rect(18, 8, 4, 9, 'p').rect(0, 0, 40, 1, '~');
  isle('coral_lagoon', {
    name: 'Coral Lagoon', music: 'beach',
    legend: { '~': 'ocean', s: 'sand', p: 'coast_pierwater' },
    rows: G.rows(),
    objects: [
      ...deckObjects(G),
      prop('sv4_post_sign', 17, 8, { use: 'sv4_dive', shadow: 6 }), prop('sv4_post_sign', 22, 8, { use: 'sv4_dive', shadow: 6 }),
      prop('sv4_store', 5, 17, { w: 3, use: 'sv4_snorkel_rent', shadow: 40 }), prop('sv4_stall_b', 28, 18, { w: 2, use: 'sv4_reefguide', shadow: 30 }),
      prop('sv4_palm', 2, 19, { shadow: 8 }), prop('sv4_palm', 36, 20, { shadow: 8 }), prop('sv4_umbrella', 12, 19, { shadow: 12 }), prop('sv4_umbrella', 32, 21, { shadow: 12 }),
      prop('sv4_boat_small', 8, 12, { w: 2, solid: true }), prop('sv4_buoy', 26, 11, { solid: false }), prop('sv4_buoy', 12, 6, { solid: false }),
    ],
    warps: [{ x: 0, y: 17, h: 5, to: 'coral_beach:from_lagoon' }],
    spawns: { default: [20, 19, 'up'], from_beach: [1, 19, 'right'] },
    spots: { jetty: [19, 17], dive_edge: [19, 9], snorkel_hut: [6, 20], guide: [29, 20], shore: [10, 21] },
  });
}

// =============================================================== BUNGALOW RESORT (22x14)
{
  const { G, legend } = room(22, 14, 11, 'int_fl_birch', 'int_wall_wood');
  inn('coral_hut_resort', {
    name: 'Overwater Bungalow', legend, rows: G.rows(), music: 'beach',
    objects: [
      { spr: 'sv4_counter', x: 2, y: 3, w: 3, h: 1, shadow: 0, use: 'sv4_hut_desk' },
      { spr: 'sv4_bed', x: 16, y: 3, w: 2, h: 1, shadow: 0, use: 'sv4_hut_bed' },
      { spr: 'sv4_window_sea', x: 8, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 }, { spr: 'sv4_window_sea', x: 12, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 },
      { spr: 'sv4_rug_r', x: 14, y: 6, w: 3, h: 2, flat: true, solid: false }, { spr: 'sv4_hammock', x: 15, y: 9, w: 2, h: 1, solid: false, use: 'sv4_hammock' },
      { spr: 'sv4_table_s', x: 5, y: 8, w: 2, h: 1, shadow: 0, interact: { label: 'Fruit basket', run: (g) => g.say(null, null, 'A basket of mango, lychee and a tiny note: "Eat me. - Lani".') } },
      { spr: 'sv4_palm', x: 1, y: 11, shadow: 8 },
    ],
    warps: [{ x: 11, y: 13, enter: 'down', to: 'coral_beach:from_hut' }],
    spawns: { default: [11, 11, 'up'], from_beach: [11, 11, 'up'] },
    spots: { desk: [3, 4, 'up'], bed: [16, 4, 'up'], door: [11, 12], porch: [11, 9] },
  });
}

// =============================================================== NIGHT MARKET (36x16)
{
  const G = grid(36, 16, 's');
  G.rect(0, 0, 36, 3, 'T').rect(2, 4, 32, 10, ':').rect(16, 14, 4, 2, ':');
  isle('coral_market', {
    name: 'Coral Night Market', music: 'festival',
    legend: { s: 'sand', T: 'coast_wood', ':': 'plaza' },
    rows: G.rows(),
    objects: [
      prop('sv4_stall_a', 4, 5, { w: 2, use: 'sv4_shop_market', shadow: 30, light: { kind: 'lantern' } }), prop('sv4_stall_b', 9, 5, { w: 2, use: 'sv4_market_snack', shadow: 30, light: { kind: 'lantern' } }),
      prop('sv4_stall_a', 21, 5, { w: 2, use: 'sv4_market_fortune', shadow: 30, light: { kind: 'lantern' } }), prop('sv4_stall_b', 26, 5, { w: 2, use: 'sv4_market_game', shadow: 30, light: { kind: 'lantern' } }),
      ...[3, 8, 14, 20, 25, 31].map((x) => prop('sv4_lantern_post', x, 9, { shadow: 6, light: { kind: 'lantern' } })),
      prop('sv4_stool', 5, 8, { solid: false }), prop('sv4_stool', 10, 8, { solid: false }), prop('sv4_palm', 1, 5, { shadow: 8 }), prop('sv4_palm', 34, 6, { shadow: 8 }), prop('sv4_barrel', 15, 5, { shadow: 6 }), prop('sv4_crate_fish', 18, 5, { shadow: 10 }),
    ],
    warps: [{ x: 16, y: 15, w: 4, to: 'coral_beach:from_market' }],
    spawns: { default: [18, 11, 'up'], from_beach: [18, 13, 'up'] },
    spots: { gate: [18, 13], food: [10, 7], shop: [5, 7], fortune: [22, 7], game: [27, 7], square: [18, 9], lanterns: [14, 10] },
  });
}
