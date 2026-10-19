// Tsubame Island: the ferry pier, the stilt village (60x40) and its inn, fishery auction hall, one-room school, shrine and diner.
import { spr } from '../town/lib.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { grid, prop, deckObjects, isle, house, room, inn } from './lib.js';
import { hasBoat } from './sea.js';
import { bottleObj } from './acts.js';

const cat = (o, x, y, dx = 24, v = 'a') => ({ spr: v === 'a' ? 'sv4_cat_roof' : 'sv4_cat_roof_b', x, y, solid: false, dx, dy: -36, shadow: 0, use: 'sv4_cat', depth: 30, ...o });
const KIDS = [[Rr.coral[2], Rr.hairBrown[2]], [Rr.sky[2], Rr.hairBlack[2]], [Rr.mint[2], Rr.hairGinger[2]], [Rr.butter[2], Rr.hairBlack[1]], [Rr.lilac[2], Rr.hairBrown[1]], [Rr.sakura[2], Rr.hairBlonde[1]]];
KIDS.forEach(([c, h], i) => spr(`sv4_kid_${i}`, 16, 26, (R) => { R(3, 14, 10, 10, c); R(3, 14, 10, 2, Rr.paper[4]); R.e(8, 9, 4, 4, Rr.skinLight[3]); R(4, 4, 8, 4, h); R(3, 6, 2, 5, h); R(6, 9, 1, 1, Rr.ink[1]); R(9, 9, 1, 1, Rr.ink[1]); }));
export const KID_NAMES = ['Sora', 'Riku', 'Hotaru', 'Daichi', 'Mei', 'Nana'];

// ---------------------------------------------------------------- pier (ferry landing)
{
  const G = grid(32, 16, '~');
  G.rect(0, 0, 13, 3, 'T').rect(0, 3, 13, 10, '.').rect(8, 3, 5, 10, 's').rect(0, 13, 13, 3, 'T').rect(13, 6, 15, 4, 'p');
  isle('tsubame_pier', {
    name: 'Tsubame Pier', music: 'beach',
    legend: { '~': 'ocean', '.': 'grass', s: 'sand', T: 'coast_wood', p: 'coast_pierwater' },
    rows: G.rows(),
    objects: [
      ...deckObjects(G),
      prop('sv4_boat_big', 16, 10, { w: 3, solid: true, dy: 4 }),
      prop('sv4_ferry_sign', 12, 5, { use: 'sv4_ferry_back', shadow: 8 }),
      prop('sv4_crate_fish', 11, 9, { shadow: 10 }), prop('sv4_barrel', 11, 4, { shadow: 6 }), prop('sv4_rope_coil', 18, 6, { solid: false }),
      prop('sv4_dock_post', 20, 6, { solid: false, dy: 2 }), prop('sv4_dock_post', 24, 9, { solid: false, dy: 2 }),
      prop('sv4_island_tree', 3, 3, { shadow: 12 }), prop('sv4_island_tree', 6, 11, { shadow: 12 }), prop('town_bush', 2, 9),
      prop('sv4_bench_s', 8, 6, { w: 1, use: 'bench', shadow: 12 }),
      bottleObj('tsubame_pier', 9, 10),
    ],
    warps: [
      { x: 0, y: 6, h: 4, to: 'tsubame_village:from_pier' },
      { x: 27, y: 6, h: 4, to: 'seto_sea:from_tsubame_pier', locked: (g) => !hasBoat(g) || g.weather === 'storm', lockedText: 'You would need a boat to launch from here. The berth is at Hoshimori Harbour.' },
    ],
    spawns: { default: [9, 8], from_village: [1, 8, 'right'], from_ferry: [14, 7, 'right'], from_seto_sea: [26, 7, 'left'] },
    spots: { ferry: [13, 6], pier_end: [26, 8], fishing: [24, 6], bench: [8, 7], crates: [11, 8], shore: [5, 8] },
  });
}

// ---------------------------------------------------------------- village
{
  const G = grid(60, 40, '~');
  G.rect(0, 0, 60, 21, '.').rect(0, 0, 52, 3, 'T').rect(56, 0, 4, 3, 'T').rect(2, 11, 56, 3, ':').rect(54, 2, 2, 9, ':').rect(0, 21, 60, 2, '.').rect(2, 21, 56, 2, 'p');
  G.rect(14, 23, 2, 8, 'p').rect(34, 23, 2, 10, 'p').rect(50, 23, 2, 6, 'p');
  G.rect(4, 15, 10, 3, 'g').rect(44, 15, 10, 3, 'g');
  const inn1 = house('sv4_inn', 6, 9, { to: 'tsubame_inn:from_village', door: 2, glow: true }), diner = house('sv4_diner', 14, 9, { to: 'tsubame_diner:from_village', door: 2, glow: true });
  const fish = house('sv4_fishery', 26, 9, { to: 'tsubame_fishery:from_village', door: 3 }), school = house('sv4_school', 44, 9, { to: 'tsubame_school:from_village', door: 2 });
  const shells = house('sv4_shellshop', 36, 9, { use: 'sv4_shop_shells' });
  const ha = house('sv4_house_a', 3, 17), hb = house('sv4_house_b', 9, 17), hc = house('sv4_house_c', 40, 17), hd = house('sv4_house_d', 50, 17);
  const w1 = house('sv4_house_c', 16, 28), w2 = house('sv4_house_b', 36, 28), w3 = house('sv4_house_a', 52, 26);
  const all = [inn1, diner, fish, school];
  isle('tsubame_village', {
    name: 'Tsubame Village', music: 'beach',
    legend: { '~': 'ocean', '.': 'grass', ':': 'dirt', g: 'meadow', T: 'coast_wood', p: 'coast_pierwater' },
    rows: G.rows(),
    objects: [
      ...deckObjects(G),
      ...all.map((h) => h.obj), shells.obj, ha.obj, hb.obj, hc.obj, hd.obj, w1.obj, w2.obj, w3.obj,
      cat({}, 3, 17, 30), cat({}, 9, 17, 20, 'b'), cat({}, 40, 17, 50), cat({}, 50, 17, 26, 'b'), cat({}, 16, 28, 60), cat({}, 36, 28, 28, 'b'), cat({}, 52, 26, 30), cat({}, 6, 9, 70, 'b'), cat({}, 26, 9, 90), cat({}, 36, 9, 24, 'b'),
      prop('sv4_squid_rack', 22, 19, { w: 3, use: 'sv4_squid', shadow: 40 }), prop('sv4_squid_rack', 43, 19, { w: 3, use: 'sv4_squid', shadow: 40 }),
      prop('sv4_net', 28, 19, { w: 2, use: 'sv4_net', shadow: 26 }), prop('sv4_net', 33, 19, { w: 2, use: 'sv4_net', shadow: 26 }),
      prop('sv4_boat_small', 22, 23, { w: 2, solid: true }), prop('sv4_boat_small', 26, 24, { w: 2, solid: true }), prop('sv4_boat_small', 40, 24, { w: 2, solid: true }),
      prop('sv4_crate_fish', 31, 15, { shadow: 10 }), prop('sv4_barrel', 32, 15, { shadow: 6 }), prop('sv4_buoy', 21, 21, { solid: false }), prop('sv4_buoy', 38, 21, { solid: false }),
      prop('sv4_bench_s', 31, 16, { use: 'bench', shadow: 12 }), prop('sv4_lantern_post', 20, 14, { shadow: 6, light: { kind: 'lantern' } }), prop('sv4_lantern_post', 41, 14, { shadow: 6, light: { kind: 'lantern' } }),
      prop('sv4_lantern_post', 12, 14, { shadow: 6, light: { kind: 'lantern' } }), prop('sv4_lantern_post', 50, 14, { shadow: 6, light: { kind: 'lantern' } }),
      prop('sv4_island_tree', 1, 5, { shadow: 12 }), prop('sv4_island_tree', 24, 4, { shadow: 12 }), prop('sv4_island_tree', 36, 5, { shadow: 12 }), prop('sv4_island_tree', 57, 17, { shadow: 12 }),
      prop('sv4_palm', 18, 15, { shadow: 8 }), prop('sv4_palm', 56, 7, { shadow: 8 }), prop('town_bush_flower', 5, 14), prop('town_bush', 47, 15), prop('town_bush_flower', 12, 19),
      prop('sv4_torii', 53, 4, { w: 3, solid: false, dy: 0 }),
      prop('sv4_post_sign', 56, 12, { use: 'sv4_village_sign', shadow: 6 }),
      bottleObj('tsubame_village', 30, 20),
    ],
    warps: [
      inn1.warp, diner.warp, fish.warp, school.warp,
      { x: 59, y: 11, h: 3, to: 'tsubame_pier:from_village' },
      { x: 54, y: 0, w: 2, to: 'tsubame_shrine:from_village' },
    ],
    spawns: { default: [30, 13], from_pier: [58, 12, 'left'], from_inn: inn1.spawn, from_diner: diner.spawn, from_fishery: fish.spawn, from_school: school.spawn, from_shrine: [54, 3, 'down'] },
    spots: { inn_door: [8, 11], diner_door: [16, 11], fishery_door: [29, 11], school_door: [46, 11], shell_shop: [37, 11], plaza: [30, 13], road_west: [4, 12], pier_steps: [57, 12], squid_rack: [23, 20], net_rack: [29, 20], boardwalk: [20, 21], bench: [31, 17], play: [48, 16], shrine_path: [54, 6], cat_alley: [8, 19], shore_east: [45, 21] },
  });
}

// ---------------------------------------------------------------- inn (20x12)
{
  const { G, legend } = room(20, 12, 10);
  inn('tsubame_inn', {
    name: 'Tsubame Inn', legend, rows: G.rows(),
    objects: [
      { spr: 'sv4_counter', x: 8, y: 3, w: 3, h: 1, shadow: 0, dx: 0, interact: { label: 'Inn desk', run: (g) => g.say('ume', 'happy', 'Welcome to the inn! A bed is 60 coins. If the last ferry left without you, the night is on the house. Nobody sleeps on a pier in my village.') } },
      { spr: 'sv4_bed', x: 15, y: 3, w: 2, h: 1, shadow: 0, use: 'sv4_inn_bed' }, { spr: 'sv4_bed', x: 17, y: 3, w: 2, h: 1, shadow: 0, interact: { label: 'Guest bed', run: (g) => g.say(null, null, 'Another guest bed, made up with crisp white sheets that smell of sun.') } },
      { spr: 'sv4_window_sea', x: 3, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 }, { spr: 'sv4_window_sea', x: 13, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 },
      { spr: 'sv4_table_s', x: 4, y: 6, w: 2, h: 1, shadow: 0, use: 'sv4_inn_tea' }, { spr: 'sv4_stool', x: 3, y: 6, solid: false }, { spr: 'sv4_stool', x: 6, y: 6, solid: false },
      { spr: 'sv4_rug_r', x: 7, y: 6, w: 3, h: 2, flat: true, solid: false }, { spr: 'sv4_shelf', x: 1, y: 3, w: 2, h: 1, shadow: 0, interact: { label: 'Guest book', run: (g) => g.use ? null : g.say(null, null, 'The guest book: "Best squid. Worst ferry hair. 10/10." and a doodle of a cat on a roof.') } },
    ],
    warps: [{ x: 10, y: 11, enter: 'down', to: 'tsubame_village:from_inn' }],
    spawns: { default: [10, 9, 'up'], from_village: [10, 9, 'up'] },
    spots: { desk: [9, 4, 'up'], bed: [15, 4, 'up'], table: [5, 7, 'up'], door: [10, 10], window: [4, 4, 'up'] },
  });
}

// ---------------------------------------------------------------- fishery (24x14)
{
  const { G, legend } = room(24, 14, 12, 'int_fl_lino_sky', 'int_wall_wood');
  inn('tsubame_fishery', {
    name: 'Tsubame Fishery', legend, rows: G.rows(), music: 'cafe',
    objects: [
      { spr: 'sv4_board', x: 9, y: 2, w: 4, h: 1, shadow: 0, use: 'sv4_auction' },
      { spr: 'sv4_counter', x: 2, y: 3, w: 3, h: 1, shadow: 0, use: 'sv4_shop_fishery' },
      { spr: 'sv4_counter_s', x: 18, y: 3, w: 2, h: 1, shadow: 0, use: 'sv4_job_fishery' },
      { spr: 'sv4_crate_fish', x: 3, y: 8, shadow: 10 }, { spr: 'sv4_crate_fish', x: 4, y: 8, shadow: 10 }, { spr: 'sv4_crate_fish', x: 19, y: 8, shadow: 10 }, { spr: 'sv4_barrel', x: 20, y: 8, shadow: 6 },
      { spr: 'sv4_pool', x: 7, y: 8, w: 2, h: 1, shadow: 0, interact: { label: 'Look in the tank', run: (g) => g.say(null, null, 'A tank of live flounder and one very opinionated octopus. He watches you back.') } },
      { spr: 'sv4_pool', x: 14, y: 8, w: 2, h: 1, shadow: 0, interact: { label: 'Look in the tank', run: (g) => g.say(null, null, 'Prawns drift in slow circles. The label reads: "Do not name them. Tetsu already did."') } },
      { spr: 'sv4_stool', x: 8, y: 5, solid: false }, { spr: 'sv4_stool', x: 10, y: 5, solid: false }, { spr: 'sv4_stool', x: 12, y: 5, solid: false }, { spr: 'sv4_stool', x: 14, y: 5, solid: false },
    ],
    warps: [{ x: 12, y: 13, enter: 'down', to: 'tsubame_village:from_fishery' }],
    spawns: { default: [12, 11, 'up'], from_village: [12, 11, 'up'] },
    spots: { auction: [11, 4, 'up'], shop: [3, 4, 'up'], job: [19, 4, 'up'], buyers: [9, 6], door: [12, 12] },
  });
}

// ---------------------------------------------------------------- school (18x12)
{
  const { G, legend } = room(18, 12, 9, 'int_fl_planks', 'int_wall_school');
  const desks = [[4, 6], [7, 6], [10, 6], [4, 8], [7, 8], [10, 8]];
  inn('tsubame_school', {
    name: 'Tsubame School', legend, rows: G.rows(), music: 'school',
    objects: [
      { spr: 'sv4_blackboard', x: 6, y: 2, w: 3, h: 1, shadow: 0, interact: { label: 'Blackboard', run: (g) => g.say(null, null, 'Today\'s lesson in chalk: "How many tides in a day? Two! Why? Ask the moon." Under it, a drawing of a squid in a hat.') } },
      { spr: 'sv4_desk_s', x: 13, y: 3, w: 1, h: 1, shadow: 0, use: 'sv4_school_teach' }, { spr: 'sv4_window_sea', x: 2, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 }, { spr: 'sv4_window_sea', x: 12, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 },
      ...desks.map(([x, y], i) => ({ spr: 'sv4_desk_s', x, y, shadow: 0, interact: { label: 'Talk to ' + KID_NAMES[i], run: (g) => g.run([{ t: 'say', who: null, mood: null, text: `${KID_NAMES[i]}: ${['I want to be a captain! Or a cat.', 'Teacher says the sea has a pulse. I felt it with my feet.', 'Do you live on the big island? Do they have elevators?', 'I can hold my breath for forty seconds. Forty-one!', 'I drew you a picture. It is a squid. It is also you.', 'We only have six kids, so everybody is class president.'][i]}` }]) } })),
      ...desks.map(([x, y], i) => ({ spr: `sv4_kid_${i}`, x, y, solid: false, dx: 8, dy: -8 })),
      { spr: 'sv4_shelf', x: 1, y: 4, w: 2, h: 1, shadow: 0, interact: { label: 'Bookshelf', run: (g) => g.say(null, null, 'Sea atlases, a tattered "Whales of the World" and a lot of comics about cooking.') } },
    ],
    warps: [{ x: 9, y: 11, enter: 'down', to: 'tsubame_village:from_school' }],
    spawns: { default: [9, 9, 'up'], from_village: [9, 9, 'up'] },
    spots: { teacher: [13, 4, 'down'], desk_front: [7, 5], window: [3, 3], back: [14, 9], door: [9, 10] },
  });
}

// ---------------------------------------------------------------- shrine (24x20)
{
  const G = grid(24, 20, 'T');
  G.rect(4, 3, 16, 16, '.').rect(10, 8, 4, 12, ':').rect(6, 12, 12, 2, ':');
  isle('tsubame_shrine', {
    name: 'Swallow Shrine', music: 'shrine',
    legend: { T: 'coast_wood', '.': 'grass', ':': 'dirt' },
    rows: G.rows(),
    objects: [
      prop('sv4_shrine_small', 10, 4, { w: 2, use: 'sv4_shrine_pray', shadow: 24 }), prop('sv4_torii', 9, 15, { w: 3, solid: false }),
      prop('sv4_lantern_post', 8, 6, { shadow: 6, light: { kind: 'lantern' } }), prop('sv4_lantern_post', 14, 6, { shadow: 6, light: { kind: 'lantern' } }),
      prop('sv4_bench_s', 15, 10, { use: 'bench', shadow: 12 }), prop('sv4_island_tree', 5, 5, { shadow: 12 }), prop('sv4_island_tree', 17, 4, { shadow: 12 }), prop('town_bush_flower', 6, 14),
      { spr: 'sv4_post_sign', x: 7, y: 10, w: 1, h: 1, shadow: 6, interact: { label: 'Read the sign', run: (g) => g.say(null, null, 'Swallow Shrine. Every spring the swallows return to the same eaves. The islanders say they carry the ferry crew\'s prayers home.') } },
    ],
    warps: [{ x: 10, y: 19, w: 4, to: 'tsubame_village:from_shrine' }],
    spawns: { default: [11, 17, 'up'], from_village: [11, 17, 'up'] },
    spots: { offering: [11, 8, 'up'], torii: [11, 14], bench: [14, 10], lookout: [8, 12] },
  });
}

// ---------------------------------------------------------------- diner (18x12)
{
  const { G, legend } = room(18, 12, 9, 'int_fl_kitchen_coral', 'int_wall_cafe');
  inn('tsubame_diner', {
    name: 'Umi Diner', legend, rows: G.rows(), music: 'cafe',
    objects: [
      { spr: 'sv4_counter', x: 6, y: 3, w: 3, h: 1, shadow: 0, use: 'sv4_diner' }, { spr: 'sv4_stool', x: 6, y: 4, solid: false }, { spr: 'sv4_stool', x: 8, y: 4, solid: false },
      { spr: 'sv4_table_s', x: 3, y: 7, w: 2, h: 1, shadow: 0, interact: { label: 'Table', run: (g) => g.say(null, null, 'A table with a chipped blue cup of chopsticks and a view of the harbour.') } },
      { spr: 'sv4_table_s', x: 12, y: 7, w: 2, h: 1, shadow: 0, interact: { label: 'Table', run: (g) => g.say(null, null, 'Somebody carved "T + U" into the table. Tetsu + Umi, probably. Or a very fond tourist.') } },
      { spr: 'sv4_window_sea', x: 2, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 }, { spr: 'sv4_window_sea', x: 13, y: 1, w: 2, h: 1, flat: true, solid: false, dy: -4 },
      { spr: 'sv4_shelf', x: 12, y: 3, w: 2, h: 1, shadow: 0, interact: { label: 'Shelf', run: (g) => g.say(null, null, 'Jars of sea salt, dried kelp and a hand-lettered menu: "EIGHT dishes. All good. Ask."') } },
    ],
    warps: [{ x: 9, y: 11, enter: 'down', to: 'tsubame_village:from_diner' }],
    spawns: { default: [9, 9, 'up'], from_village: [9, 9, 'up'] },
    spots: { counter: [7, 5, 'up'], table_1: [4, 8], table_2: [13, 8], kitchen: [10, 5], door: [9, 10] },
  });
}
