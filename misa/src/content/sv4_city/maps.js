// Kitaminato maps: station plaza, Hikari Arcade, Harbour Walk, Old Town, University, and the interiors (department store x3,
// aquarium, cinema, museum, ramen street, bookstore, game centre, capsule hotel). Interaction ids are registered in activities.js / shops.js.
import { grid, TP } from '../town/lib.js';
import { building } from '../town/facade.js';
import { P, tree, lamp, streetlight, bench, row, plaque, spot } from '../town/interactions.js';
import { TOWN_MAPS } from '../town/ambience.js';
import { cmap } from './core.js';
import './art.js';

const say = (t) => plaque(t);
const merge = (...bs) => ({ objs: bs.map((b) => b.obj), warps: bs.flatMap((b) => b.warps), spawns: Object.assign({}, ...bs.map((b) => b.spawns)) });
const bld = (name, x, y, o = {}) => { const b = building(name, x, y, { shop: true, ...o }); if (o.use) b.obj.use = o.use; if (o.say) b.obj.interact = say(o.say); return b; };
const IN = { indoor: true, outdoor: false, interiors: true, music: 'shop', bg: '#1e1624' };
const LG = (floor, wall = 'int_wall_library', extra = {}) => ({ '#': wall, '.': floor, d: 'int_fl_door', ...extra });
const room = (w, h, x0, y0, x1, y1) => { const g = grid(w, h, '#'); g.fill(x0, y0, x1 - x0 + 1, y1 - y0 + 1, '.'); return g; };

// ---------------------------------------------------------------- Kitaminato Station Plaza (60x40)
{
  const g = grid(60, 40, '+');
  g.fill(0, 23, 60, 4, '_').fill(21, 0, 2, 9, '_').fill(0, 27, 60, 13, '+').blob(8, 16, 4, 3, '"').blob(51, 16, 4, 3, '"').blob(29, 33, 5, 2, '"');
  g.fill(26, 27, 8, 13, '=');
  const B = merge(
    bld('kc_f_dept', 3, 2, { to: 'kita_department:from_plaza', spawn: 'from_dept', hours: undefined }), bld('kc_f_cinema', 47, 2, { to: 'kita_cinema:from_plaza', spawn: 'from_cinema' }),
    bld('kc_f_station', 24, 2, { use: 'kc_city_gate' }),
    bld('kc_block_c', 14, 2, { say: 'Offices above, a noodle shop below. The smell of broth leaks out onto the street.' }), bld('kc_block_a', 39, 2, { say: 'A cram school. Rows of bright windows, rows of bent heads.' }), bld('kc_block_d', 56, 2, { say: 'Apartments. Someone has hung a futon off the balcony like a flag.' }),
    bld('kc_shop_sweets', 3, 29, { say: 'Cream puffs the size of fists. The queue is already twenty people long.' }), bld('kc_shop_florist', 9, 29, { say: 'Buckets of tulips and a shy cat in the window.' }),
    bld('kc_shop_toys', 44, 29, { say: 'Robots, plushies and a very serious model train in the window.' }), bld('kc_shop_optician', 50, 29, { say: 'A sign: "See the city clearly." You can see it fine already.' }),
  );
  cmap('kita_station_plaza', {
    name: 'Station Plaza', rows: g.rows(),
    objects: [
      ...B.objs,
      { ...P('kc_fountain', 27, 14, { w: 5, h: 3, use: 'fountain', shadow: 0 }), sprFn: (gm) => (gm.season === 'winter' ? 'kc_fountain_win' : 'kc_fountain') },
      P('kc_info', 36, 11, { w: 2, h: 2, use: 'kc_info', shadow: 20 }), P('kc_subway_stairs', 11, 12, { w: 2, h: 2, use: 'kc_subway' }), P('kc_subway_sign', 13, 12, { use: 'kc_subway', shadow: 6 }),
      P('kc_street_clock', 39, 12, { shadow: 5 }), P('kc_street_clock', 19, 12, { shadow: 5 }),
      bench(24, 18), bench(33, 18), bench(24, 11), bench(41, 20), bench(15, 20),
      P('kc_planter_big', 20, 20, { shadow: 16 }), P('kc_planter_big', 38, 20, { shadow: 16 }), P('kc_planter_big', 20, 11, { shadow: 16 }),
      tree('sakura', 7, 15, '_s'), tree('sakura', 10, 17), tree('sakura', 50, 14), tree('sakura', 53, 17, '_s'), tree('maple', 27, 33, '_s'), tree('maple', 32, 34),
      streetlight(23, 9), streetlight(36, 9), streetlight(22, 22), streetlight(37, 22), streetlight(23, 28), streetlight(36, 28), lamp(26, 13), lamp(32, 13), lamp(26, 18), lamp(32, 18),
      P('town_busstop_sign', 12, 28, { use: 'kc_subway', shadow: 6 }), P('town_bus_shelter', 13, 29, { w: 3, use: 'kc_subway' }),
      P('kc_map_board', 46, 11, { w: 2, h: 2, interact: say('Kitaminato map: Arcade east, Old Town west, University north, Harbour Walk south. Subway entrances everywhere.'), shadow: 20 }),
      P('town_bunting', 25, 21, { w: 6, solid: false, when: 'flag:festival_today', depth: 400, dy: -26 }),
    ],
    warps: [...B.warps, { x: 59, y: 17, w: 1, h: 4, to: 'kita_arcade:from_plaza' }, { x: 0, y: 17, w: 1, h: 4, to: 'kita_oldtown:from_plaza' }, { x: 21, y: 0, w: 2, h: 1, to: 'kita_uni:from_plaza' }, { x: 26, y: 39, w: 8, h: 1, to: 'kita_harbourwalk:from_plaza' }],
    spawns: { default: [29, 12, 'down'], from_train: [30, 9, 'down'], from_arcade: [58, 18, 'left'], from_oldtown: [1, 18, 'right'], from_uni: [21, 1, 'down'], from_harbourwalk: [29, 38, 'up'], from_subway: [34, 20, 'down'], ...B.spawns },
    spots: { fountain: [29, 18], station_gate: [30, 9], info: [37, 14], busk: [24, 20], crossing: [29, 22], bench: [25, 19], subway: [12, 15], flashmob: [29, 20], clock: [38, 14], kid: [46, 20], dept_door: [8, 9], cinema_door: [50, 9], lawn: [8, 20] },
    decals: [{ k: 'dashes', x: 0, y: 25, w: 60 }, { k: 'zebra', x: 27, y: 23, w: 4, h: 4 }, { k: 'zebra', x: 8, y: 23, w: 3, h: 4 }, { k: 'zebra', x: 48, y: 23, w: 3, h: 4 }, { k: 'rosette', x: 29, y: 15 }],
    crowd: { lanes: [[21, 2, 57], [11, 4, 56], [28, 2, 57]], base: 9 },
  });
}

// ---------------------------------------------------------------- Hikari Arcade (70x16, covered)
{
  const g = grid(70, 16, '=');
  g.fill(0, 15, 70, 1, 'W');
  const FRONTS = [['stationery', 'kc_shop_stationery'], ['electronics', 'kc_shop_electronics'], ['import', 'kc_shop_import'], ['vintage', 'kc_shop_vintage'], ['pet', 'kc_shop_pet'], ['boutique', 'kc_shop_boutique']];
  const bs = FRONTS.map(([id, use], i) => bld('kc_shop_' + id, i * 5, 0, { use }));
  bs.push(bld('kc_f_bookstore', 30, 0, { to: 'kita_bookstore:from_arcade', spawn: 'from_bookstore' }), bld('kc_f_gamecentre', 35, 0, { to: 'kita_game_centre:from_arcade', spawn: 'from_game_centre' }), bld('kc_f_ramen_gate', 40, 0, { to: 'kita_ramen_street:from_arcade', spawn: 'from_ramen_street' }),
    bld('kc_shop_sweets', 45, 0, { use: 'kc_shop_sweets' }), bld('kc_shop_bakery', 50, 0, { use: 'kc_shop_bakery' }), bld('kc_shop_toys', 55, 0, { say: 'A toy shop with a train set that circles the whole window. Kids press their noses to the glass.' }),
    bld('kc_f_hotel', 60, 0, { to: 'kita_capsule_hotel:from_arcade', spawn: 'from_capsule_hotel' }));
  const B = merge(...bs);
  TOWN_MAPS.add('kita_arcade');
  cmap('kita_arcade', {
    name: 'Hikari Arcade', indoor: true, outdoor: false, bg: '#241c34', rows: g.rows(),
    objects: [
      ...B.objs,
      ...[3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63].map((x) => P('town_lanterns', x, 7, { w: 3, solid: false, depth: 400, dy: -22 })),
      P('town_arcade_pillar', 10, 12, { shadow: 6 }), P('town_arcade_pillar', 22, 12, { shadow: 6 }), P('town_arcade_pillar', 34, 12, { shadow: 6 }), P('town_arcade_pillar', 46, 12, { shadow: 6 }), P('town_arcade_pillar', 58, 12, { shadow: 6 }),
      P('kc_stall_flower', 12, 11, { w: 2, h: 2, shadow: 24, interact: say('Cut flowers, wrapped in newspaper. The florist hums while she ties the ribbons.') }), P('kc_stall_drink', 28, 11, { w: 2, h: 2, shadow: 24, use: 'kc_stall_drink' }),
      P('kc_stall_taco', 50, 11, { w: 2, h: 2, shadow: 24, use: 'kc_stall_snack' }), bench(18, 12), bench(41, 12), bench(66, 12),
      P('kc_planter_big', 4, 12), P('kc_planter_big', 16, 12), P('kc_planter_big', 64, 7),
      P('kc_map_board', 67, 5, { w: 2, h: 2, interact: say('Hikari Arcade: 12 shops, open 10 AM to 8 PM. Rain? Everyone comes here.'), shadow: 20 }),
      P('town_vending', 1, 11, { use: 'vending', shadow: 12 }), P('town_vending', 68, 11, { use: 'vending', shadow: 12 }),
    ],
    warps: [...B.warps, { x: 0, y: 8, w: 1, h: 4, to: 'kita_station_plaza:from_arcade' }, { x: 69, y: 8, w: 1, h: 4, to: 'kita_harbourwalk:from_arcade' }],
    spawns: { default: [3, 9, 'right'], from_plaza: [1, 9, 'right'], from_harbourwalk: [68, 9, 'left'], from_subway: [34, 9, 'down'], ...B.spawns },
    spots: { west: [2, 9], east: [67, 9], stationery: [3, 6], electronics: [8, 6], import: [13, 6], vintage: [18, 6], pet: [23, 6], boutique: [28, 6], bookstore_door: [32, 6], game_door: [37, 6], ramen_door: [42, 6], sweets: [47, 6], bakery: [52, 6], parcel_pick: [4, 6], parcel_drop: [66, 9], bench: [35, 10], mall: [30, 9] },
    crowd: { lanes: [[8, 3, 66], [10, 3, 66], [13, 3, 66]], base: 12, rainy: 1.6 },
  });
}

// ---------------------------------------------------------------- Harbour Walk (64x24)
{
  const g = grid(64, 24, '=');
  g.fill(0, 16, 64, 8, '~').fill(28, 15, 4, 7, '=').fill(26, 0, 4, 6, '=');
  const B = merge(bld('kc_f_aquarium', 8, 0, { to: 'kita_aquarium:from_harbourwalk', spawn: 'from_aquarium' }), bld('kc_block_d', 2, 0, { say: 'A fishing supply shop and, above it, a very quiet dentist.' }), bld('kc_block_c', 20, 0, { say: 'Seafood restaurants stacked three storeys high. Every window smells delicious.' }),
    bld('kc_block_a', 30, 0, { say: 'A hotel with a view of the bay, and a balcony full of sleepy gulls.' }), bld('kc_block_b', 36, 0, { say: 'The harbour office. Ferry timetables are pinned in the window.' }));
  cmap('kita_harbourwalk', {
    name: 'Harbour Walk', rows: g.rows(), music: 'town',
    objects: [
      ...B.objs,
      { ...P('kc_ferris_0', 44, 4, { w: 5, h: 2, use: 'kc_ferris', shadow: 0 }), sprFn: (gm) => `kc_ferris_${Math.floor(gm.clock * 1.6) % 4}`, light: { kind: 'lamp', y: -80 } },
      P('kc_ferris_booth', 41, 4, { w: 2, h: 2, use: 'kc_ferris', shadow: 20 }),
      ...row('kc_boardwalk_rail', 0, 27, 15), ...row('kc_boardwalk_rail', 32, 63, 15),
      P('kc_boat', 8, 18, { w: 3, h: 2, shadow: 0 }), P('kc_boat', 50, 19, { w: 3, h: 2, shadow: 0 }), P('kc_boat', 38, 21, { w: 3, h: 2, shadow: 0 }),
      P('kc_stall_taco', 52, 7, { w: 2, h: 2, shadow: 24, use: 'kc_stall_snack' }), P('kc_stall_photo', 36, 8, { w: 2, h: 2, shadow: 24, interact: say('A photo stall. The man says the best shot of the day is always at sunset.') }),
      P('kc_stall_drink', 14, 10, { w: 2, h: 2, shadow: 24, use: 'kc_stall_drink' }),
      bench(18, 12), bench(24, 12), bench(46, 12), bench(56, 12), bench(29, 17), bench(29, 19),
      tree('sakura', 33, 8, '_s'), tree('maple', 5, 9), tree('maple', 60, 10), tree('pine', 61, 6),
      streetlight(16, 6), streetlight(38, 10), streetlight(56, 8), lamp(28, 14), lamp(31, 14), lamp(28, 20), lamp(31, 20), P('kc_subway_stairs', 18, 7, { w: 2, h: 2, use: 'kc_subway' }), P('kc_subway_sign', 20, 7, { use: 'kc_subway', shadow: 6 }),
      P('kc_map_board', 4, 11, { w: 2, h: 2, interact: say('Harbour Walk: the aquarium, the ferris wheel and the ferry pier. The wheel glows after sunset.'), shadow: 20 }),
    ],
    warps: [...B.warps, { x: 26, y: 0, w: 4, h: 1, to: 'kita_station_plaza:from_harbourwalk' }, { x: 0, y: 8, w: 1, h: 4, to: 'kita_arcade:from_harbourwalk' }],
    spawns: { default: [27, 3, 'down'], from_plaza: [27, 1, 'down'], from_arcade: [1, 9, 'right'], from_subway: [19, 10, 'down'], ...B.spawns },
    spots: { aquarium_door: [12, 7], ferris: [42, 7], pier_end: [29, 20], takoyaki: [52, 10], promenade: [30, 10], bench: [19, 13], balloon_tree: [33, 10], umi_break: [16, 8], fireworks: [30, 13], lantern_spot: [24, 10], vendor: [53, 10], photo: [37, 11], sunset: [47, 9] },
    crowd: { lanes: [[9, 2, 60], [12, 2, 60], [14, 2, 27]], base: 8, sunny: 1.5, rainy: 0.2 },
  });
}

// ---------------------------------------------------------------- Old Town (56x34)
{
  const g = grid(56, 34, 'g');
  g.fill(22, 0, 12, 9, '=').fill(0, 20, 23, 1, '#').fill(4, 20, 2, 1, 'g').fill(0, 21, 9, 8, ':').fill(9, 21, 1, 8, 'S').fill(0, 29, 10, 1, 'S').fill(0, 10, 9, 5, '"').fill(46, 22, 10, 10, '"');
  g.fill(9, 23, 1, 1, ':');
  const B = merge(bld('kc_f_tea', 10, 10, { use: 'kc_tea' }), bld('kc_f_tea_b', 17, 10, { say: 'Wagashi shaped like maple leaves. The paper sign says: sold out by noon.' }), bld('kc_f_tea_b', 34, 10, { say: 'A pottery shop. Rows of tea bowls, each with a tiny thumbprint.' }), bld('kc_f_tea', 40, 10, { use: 'kc_tea' }),
    bld('kc_f_tea_b', 12, 22, { say: 'A calligrapher\'s studio. Brush strokes dry on a line like laundry.' }), bld('kc_f_tea', 38, 22, { say: 'An old kimono shop. A grandma waves from behind a bolt of indigo cloth.' }));
  const cats = [['kc_cat_a', 2, 23], ['kc_cat_b', 5, 25], ['kc_cat_c', 7, 22], ['kc_cat_d', 3, 27]].map(([s, x, y]) => P(s, x, y, { use: 'kc_cat', shadow: 8 }));
  cmap('kita_oldtown', {
    name: 'Old Town', rows: g.rows(), music: 'town',
    objects: [
      ...B.objs,
      P('kc_temple', 25, 0, { w: 5, h: 4, use: 'kc_temple', shadow: 0, light: { kind: 'shrine' } }), P('kc_torii', 27, 7, { w: 2, h: 2, solid: false, depth: 300 }),
      ...[7, 9, 11, 13].flatMap((y) => [P('town_stone_lantern', 23, y, { shadow: 8, light: { kind: 'lantern' } }), P('town_stone_lantern', 32, y, { shadow: 8, light: { kind: 'lantern' } })]),
      P('kc_tea_lantern', 12, 15, { shadow: 5 }), P('kc_tea_lantern', 42, 15, { shadow: 5 }), ...cats, P('kc_cat_d', 8, 19, { use: 'kc_cat', shadow: 8 }),
      P('kc_subway_stairs', 48, 13, { w: 2, h: 2, use: 'kc_subway' }), P('kc_subway_sign', 50, 13, { use: 'kc_subway', shadow: 6 }),
      tree('maple', 3, 11), tree('maple', 6, 13, '_s'), tree('sakura', 47, 24), tree('maple', 51, 27), tree('pine', 53, 23, '_s'), tree('maple', 20, 8), tree('maple', 36, 7),
      bench(30, 12), bench(26, 12), P('kc_map_board', 28, 21, { w: 2, h: 2, interact: say('Old Town: the temple at the end of the street, teahouses, and (they say) a few secrets down the side lanes.'), shadow: 20 }),
      row('town_hedge', 10, 22, 20)[0], ...row('town_hedge', 11, 22, 20), ...row('town_hedge', 0, 3, 20).slice(0, 0),
    ].filter(Boolean),
    warps: [...B.warps, { x: 55, y: 16, w: 1, h: 4, to: 'kita_station_plaza:from_oldtown' }],
    spawns: { default: [28, 18, 'down'], from_plaza: [54, 17, 'left'], from_subway: [49, 16, 'down'], ...B.spawns },
    spots: { temple: [27, 5], tea_door: [13, 16], tea_door2: [43, 16], alley: [4, 24], cats: [4, 25], cross: [28, 18], bench: [28, 13], lantern_row: [28, 14], street: [28, 10], calligraphy: [15, 27] },
    crowd: { lanes: [[17, 2, 54], [18, 2, 54]], base: 5, sunny: 1.2, rainy: 0.4 },
  });
}

// ---------------------------------------------------------------- University (56x34)
{
  const g = grid(56, 34, '"');
  g.fill(21, 10, 2, 24, '=').fill(4, 20, 49, 2, '=').fill(14, 9, 2, 1, '=').fill(40, 10, 4, 10, '=').fill(4, 12, 2, 8, '=');
  g.blob(12, 26, 5, 3, ',').blob(40, 27, 5, 3, ',');
  const B = merge(bld('kc_f_unihall', 17, 2, { use: 'kc_openday' }), bld('kc_f_lecture', 3, 6, { use: 'kc_lecture' }), bld('kc_f_museum', 40, 4, { to: 'kita_museum:from_uni', spawn: 'from_museum' }));
  cmap('kita_uni', {
    name: 'Kitaminato University', rows: g.rows(), music: 'town',
    objects: [
      ...B.objs,
      P('town_gate_pillar', 19, 30, { shadow: 8 }), P('town_gate_pillar', 24, 30, { shadow: 8 }), P('kc_uni_sign', 26, 30, { w: 2, h: 2, interact: say('Kitaminato University. Open campus days: ask at the Main Hall.'), shadow: 20 }),
      P('kc_stall_drink', 30, 21, { w: 2, h: 2, shadow: 24, use: 'kc_stall_drink' }), bench(33, 24), bench(10, 23), bench(26, 15), bench(16, 15), P('town_bikerack', 8, 17, { w: 2, shadow: 14 }),
      tree('sakura', 12, 26), tree('sakura', 9, 24, '_s'), tree('sakura', 40, 27), tree('sakura', 43, 25, '_s'), tree('oak', 28, 8), tree('oak', 14, 4), tree('maple', 50, 8), tree('maple', 52, 15), tree('pine', 3, 31), tree('pine', 52, 31),
      streetlight(20, 14), streetlight(23, 14), streetlight(20, 26), streetlight(23, 26), lamp(10, 21), lamp(34, 21), P('kc_planter_big', 17, 11), P('kc_planter_big', 26, 11),
      P('kc_map_board', 6, 24, { w: 2, h: 2, interact: say('Campus map: Main Hall, Lecture Hall B, the Museum, and the big lawn. Students nap on the lawn. Please step around them.'), shadow: 20 }),
    ],
    warps: [...B.warps, { x: 20, y: 33, w: 4, h: 1, to: 'kita_station_plaza:from_uni' }],
    spawns: { default: [21, 31, 'up'], from_plaza: [21, 32, 'up'], from_subway: [30, 25, 'down'], ...B.spawns },
    spots: { gate: [21, 31], lawn: [14, 23], hall_door: [22, 10], lecture_door: [6, 12], museum_door: [43, 11], bench: [33, 25], cafeteria: [30, 23], path: [21, 18] },
    crowd: { lanes: [[20, 3, 52], [21, 3, 52]], base: 6, sunny: 1.3 },
  });
}

// ---------------------------------------------------------------- Department store: 1F clothes, 2F books and stationery, rooftop garden
{
  const g1 = room(30, 16, 1, 2, 28, 14); g1.fill(14, 15, 2, 1, 'd');
  cmap('kita_department', {
    ...IN, name: 'Hoshizora Dept Store 1F', legend: LG('int_fl_carpet'), rows: g1.rows(),
    objects: [
      ...[3, 6, 9, 20, 23].map((x) => P('kc_rack_dress', x, 3, { shadow: 16, interact: say('Dresses, jackets and one very bold polka-dot coat. The tag says it is "adventurous".') })),
      P('kc_dressform', 12, 3, { shadow: 8, interact: say('A mannequin in a trench coat. It has better posture than me.') }), P('kc_dressform', 17, 3, { shadow: 8, interact: say('A mannequin in a sailor collar. Very seaside.') }),
      { spr: 'int_register', x: 13, y: 7, w: 2, shadow: 22, use: 'kc_dept_clerk' }, { spr: 'int_mirror', x: 26, y: 4, shadow: 6, interact: say('A tall mirror. My hair is fine. Probably.') }, { spr: 'int_plant_tall', x: 1, y: 3, shadow: 9 },
      { spr: 'int_clothes_rack', x: 4, y: 9, w: 2, shadow: 18, interact: say('The sale rack! Everything is half price, which means nothing is cheap.') }, { spr: 'int_clothes_rack', x: 21, y: 9, w: 2, shadow: 18, interact: say('Scarves in every colour. I want them all.') },
      { spr: 'int_stairs_up', x: 27, y: 2, solid: false },
    ],
    warps: [{ x: 14, y: 15, w: 2, h: 1, enter: 'down', to: 'kita_station_plaza:from_dept' }, { x: 27, y: 2, enter: 'up', to: 'kita_department_2f:from_1f' }],
    spawns: { default: [14, 12, 'up'], from_plaza: [14, 14, 'up'], from_2f: [27, 3, 'down'] },
    spots: { counter: [14, 9, 'up'], racks: [7, 5], stairs: [27, 4], door: [14, 13], mirror: [26, 6] },
  });
  const g2 = room(30, 16, 1, 2, 28, 14);
  cmap('kita_department_2f', {
    ...IN, name: 'Dept Store 2F: Books and Stationery', legend: LG('int_fl_walnut'), rows: g2.rows(),
    objects: [
      ...[2, 5, 8].map((x) => ({ spr: 'kc_shelf_book', x, y: 4, w: 2, h: 2, shadow: 0, interact: say('Bestsellers, cookbooks and an entire shelf about cats.') })), { spr: 'int_stack', x: 12, y: 4, w: 2, h: 2, shadow: 0, interact: say('A wall of paperbacks, sorted by the colour of the spine. Chaos, but pretty.') },
      { spr: 'kc_shelf_pen', x: 17, y: 4, w: 2, h: 2, shadow: 0, interact: say('Fountain pens, washi tape and tiny notebooks. My wallet is nervous.') }, { spr: 'kc_shelf_pen', x: 20, y: 4, w: 2, h: 2, shadow: 0, interact: say('Pencils that smell like oranges. Of course I sniffed one.') },
      { spr: 'int_reading_table', x: 6, y: 9, w: 2, shadow: 20, interact: say('A reading table. A student has fallen asleep on a dictionary.') }, { spr: 'int_register', x: 13, y: 9, w: 2, shadow: 22, use: 'kc_dept_2f_clerk' }, { spr: 'int_plant_tall', x: 1, y: 3, shadow: 9 },
      { spr: 'int_stairs_down', x: 24, y: 2, solid: false }, { spr: 'int_stairs_up', x: 27, y: 2, solid: false },
    ],
    warps: [{ x: 24, y: 2, enter: 'up', to: 'kita_department:from_2f' }, { x: 27, y: 2, enter: 'up', to: 'kita_department_roof:from_2f' }],
    spawns: { default: [15, 12, 'up'], from_1f: [24, 3, 'down'], from_roof: [27, 3, 'down'] },
    spots: { counter: [14, 11, 'up'], books: [10, 7], pens: [19, 7], stairs: [25, 4], reading: [8, 11] },
  });
  const g3 = grid(30, 16, '"'); g3.fill(0, 0, 30, 2, '#').fill(0, 14, 30, 2, '#').fill(0, 0, 1, 16, '#').fill(29, 0, 1, 16, '#').fill(2, 6, 26, 2, '=');
  cmap('kita_department_roof', {
    name: 'Rooftop Garden', rows: g3.rows(), music: 'shop',
    objects: [
      ...[3, 13, 22].map((x) => P('town_flowerbed', x, 10, { w: 2, interact: say('Marigolds and mint, tended by the store\'s gardening club of retired clerks.') })), tree('sakura', 15, 4, '_s'), tree('maple', 26, 12),
      P('kc_claw', 3, 4, { w: 2, h: 2, use: 'kc_claw_play', shadow: 20 }), P('kc_claw', 6, 4, { w: 2, h: 2, use: 'kc_claw_play', shadow: 20 }), { spr: 'int_arcade', x: 10, y: 4, h: 2, shadow: 10, interact: say('A rooftop arcade cabinet: Neko Jump, the kiddie edition.') },
      bench(12, 12), bench(18, 8), P('town_vending', 20, 3, { use: 'vending', shadow: 12 }), { spr: 'int_scope', x: 24, y: 4, h: 2, shadow: 8, interact: { label: 'Look through', run: (gm) => gm.say('misa', 'happy', 'The whole city sprawls out below, and past the bridge, a thin line of sea where Hoshimori hides.') } },
      { spr: 'int_stairs_down', x: 27, y: 2, solid: false }, lamp(8, 9), lamp(20, 9),
    ],
    warps: [{ x: 27, y: 2, enter: 'up', to: 'kita_department_2f:from_roof' }],
    spawns: { default: [14, 8, 'down'], from_2f: [27, 3, 'down'] },
    spots: { garden: [15, 9], game_corner: [5, 7], view: [24, 7], bench: [13, 11] },
  });
}

// ---------------------------------------------------------------- Aquarium (36x20)
{
  const g = room(36, 20, 1, 2, 34, 18); g.fill(0, 19, 36, 1, '#').fill(5, 19, 1, 1, 'd');
  g.fill(11, 2, 1, 16, '#').fill(11, 12, 1, 2, '.').fill(14, 14, 16, 3, 'w').fill(12, 12, 22, 1, 'n');
  const rowN = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => i); void rowN;
  const tanks = [13, 16, 19, 22, 25, 28].flatMap((x, i) => [{ spr: 'kc_tank_0', x, y: 3, w: 3, h: 2, shadow: 0, sprFn: (gm) => `kc_tank_${Math.floor(gm.clock * 1.4 + i) % 2}`, light: { kind: 'window', y: 4 }, interact: say('Sea bream, rays and a school of silver sardines that all turn at once, like a thought.') },
    { spr: 'kc_tank_0', x, y: 10, w: 3, h: 2, shadow: 0, sprFn: (gm) => `kc_tank_${Math.floor(gm.clock * 1.4 + i + 1) % 2}`, interact: say('Jellyfish drift like slow lanterns. I could watch them forever.') }]);
  cmap('kita_aquarium', {
    ...IN, name: 'Bay Aquarium', bg: '#0e1a2e', legend: LG('int_fl_lino_sky', 'int_wall_post', { n: 'int_fl_carpet_navy', w: 'kc_pool' }), rows: g.rows(),
    objects: [
      { spr: 'int_post_counter', x: 3, y: 4, w: 3, shadow: 24, use: 'kc_aq_ticket' }, { spr: 'int_plant_tall', x: 1, y: 3, shadow: 9 }, { spr: 'int_bench', x: 7, y: 14, w: 2, shadow: 16, use: 'bench' }, { spr: 'int_plant_tall', x: 9, y: 16, shadow: 9 },
      { x: 12, y: 5, w: 1, h: 5, when: (gm) => !gm.state.kita || gm.state.kita.aqDay !== gm.day, interact: { label: 'Tunnel gate', run: (gm) => gm.say('misa', 'neutral', 'The tunnel gate is closed. Tickets at the front desk.') } },
      ...tanks, { spr: 'kc_tunnel_arch', x: 32, y: 6, w: 2, h: 2, solid: false, flat: true },
      { x: 18, y: 13, w: 3, h: 1, solid: false, use: 'kc_feed_show' }, { spr: 'int_bench', x: 14, y: 17, w: 2, shadow: 16, use: 'bench' }, { spr: 'int_bench', x: 25, y: 17, w: 2, shadow: 16, use: 'bench' },
      { spr: 'int_plant_tall', x: 33, y: 16, shadow: 9 }, { spr: 'int_box', x: 31, y: 13, shadow: 10, interact: say('A bucket of fish for the otters. Do not touch. Do not even smell.') },
    ],
    warps: [{ x: 5, y: 19, enter: 'down', to: 'kita_harbourwalk:from_aquarium' }],
    spawns: { default: [5, 16, 'up'], from_harbourwalk: [5, 17, 'up'] },
    spots: { desk: [4, 6, 'up'], tunnel: [22, 7], pool: [20, 12], tank_top: [17, 12], show: [20, 12], exit: [5, 17], seats: [15, 16] },
  });
}

// ---------------------------------------------------------------- Cinema (30x18)
{
  const g = room(30, 18, 1, 2, 28, 8); g.fill(1, 10, 28, 7, '.').fill(14, 9, 2, 1, '.').fill(14, 17, 2, 1, 'd');
  const seats = [4, 7, 10, 13, 16, 19].flatMap((x) => [{ spr: 'kc_seat_row', x, y: 5, w: 3, solid: false, use: 'kc_seat' }, { spr: 'kc_seat_row', x, y: 7, w: 3, solid: false, use: 'kc_seat' }]);
  cmap('kita_cinema', {
    ...IN, name: 'Star Cinema', legend: LG('int_fl_carpet_navy', 'int_wall_school', { d: 'int_fl_door' }), rows: g.rows(),
    objects: [
      { spr: 'kc_screen', x: 11, y: 2, w: 6, h: 2, shadow: 0, light: { kind: 'screen', y: 30 }, interact: say('The big screen. It is black and silent until the lights go down.') }, ...seats.slice(0, 12).filter((s, i) => i % 3 !== 2),
      { spr: 'int_register', x: 6, y: 12, w: 2, shadow: 22, use: 'kc_cinema_desk' }, { spr: 'kc_popcorn', x: 22, y: 12, h: 2, shadow: 10, use: 'kc_popcorn_stand' },
      ...[0, 1, 2, 3, 4, 5].map((i) => ({ spr: 'kc_poster', x: 2 + i * 4 + (i > 2 ? 3 : 0), y: 11, h: 2, shadow: 6, use: 'kc_poster_' + i })).filter((o) => o.x !== 14 && o.x !== 15),
      { spr: 'int_plant_tall', x: 28, y: 11, shadow: 9 }, { spr: 'int_plant_tall', x: 1, y: 11, shadow: 9 }, { spr: 'int_bench', x: 24, y: 15, w: 2, shadow: 16, use: 'bench' },
    ],
    warps: [{ x: 14, y: 17, w: 2, h: 1, enter: 'down', to: 'kita_station_plaza:from_cinema' }],
    spawns: { default: [14, 14, 'up'], from_plaza: [14, 16, 'up'] },
    spots: { lobby: [14, 13], usher: [15, 10], counter: [7, 14, 'up'], seat: [11, 6], popcorn: [22, 14, 'up'] },
  });
}

// ---------------------------------------------------------------- Museum (32x20)
{
  const g = room(32, 20, 1, 2, 30, 18); g.fill(15, 19, 2, 1, 'd');
  cmap('kita_museum', {
    ...IN, name: 'City Museum', legend: LG('int_fl_walnut', 'int_wall_clock'), rows: g.rows(),
    objects: [
      { spr: 'kc_fossil', x: 3, y: 4, w: 3, h: 2, shadow: 30, interact: say('A huge skeleton of a sea creature, found in the cliffs north of Kitaminato. The placard says "Kitaminato-saurus". Very creative.') },
      ...[10, 13].map((x) => ({ spr: 'kc_case_a', x, y: 4, w: 2, h: 2, shadow: 18, interact: say('Pressed sea shells from a century ago, each with a tiny handwritten label.') })), ...[20, 23].map((x) => ({ spr: 'kc_case_b', x, y: 4, w: 2, h: 2, shadow: 18, interact: say('Meteorites and glittering minerals. One is labelled "found by a child, 1962".') })),
      { spr: 'kc_painting', x: 27, y: 2, w: 2, flat: true, solid: false, dy: -4 }, { spr: 'kc_painting', x: 7, y: 2, w: 2, flat: true, solid: false, dy: -4 }, { spr: 'kc_painting', x: 17, y: 2, w: 2, flat: true, solid: false, dy: -4 },
      ...[0, 1, 2, 3].map((i) => ({ spr: 'kc_exhibit_sign', x: 4 + i * 7, y: 9, h: 2, shadow: 6, use: 'kc_exhibit_' + i })),
      { spr: 'kc_case_a', x: 4, y: 13, w: 2, h: 2, shadow: 18, interact: say('Antique fishing floats of green glass. They look like frozen bubbles.') }, { spr: 'kc_case_b', x: 24, y: 13, w: 2, h: 2, shadow: 18, interact: say('Old maps of the bay. Hoshimori is a tiny dot labelled "good harbour".') },
      { spr: 'int_post_counter', x: 14, y: 14, w: 3, shadow: 24, use: 'kc_museum_desk' }, { spr: 'int_bench', x: 8, y: 17, w: 2, shadow: 16, use: 'bench' }, { spr: 'int_bench', x: 21, y: 17, w: 2, shadow: 16, use: 'bench' }, { spr: 'int_plant_tall', x: 1, y: 3, shadow: 9 }, { spr: 'int_plant_tall', x: 30, y: 3, shadow: 9 },
    ],
    warps: [{ x: 15, y: 19, w: 2, h: 1, enter: 'down', to: 'kita_uni:from_museum' }],
    spawns: { default: [15, 16, 'up'], from_uni: [15, 18, 'up'] },
    spots: { desk: [15, 16, 'up'], hall: [8, 7], curator: [18, 12], fossils: [5, 7] },
  });
}

// ---------------------------------------------------------------- Ramen Street (40x14)
{
  const g = room(40, 14, 1, 2, 38, 12); g.fill(19, 13, 2, 1, 'd');
  const stalls = [2, 10, 18, 26, 33].map((x, i) => [{ spr: 'kc_ramen_counter', x, y: 3, w: 4, h: 2, shadow: 0, use: 'kc_ramen_' + i, light: { kind: 'lamp', y: 4 } }, { spr: 'kc_noren_ramen', x, y: 2, w: 3, flat: true, solid: false, dy: -6, dx: 6 }]).flat();
  cmap('kita_ramen_street', {
    ...IN, name: 'Ramen Street', bg: '#2a1a22', legend: LG('int_fl_stone', 'int_wall_goro'), rows: g.rows(),
    objects: [...stalls, ...[3, 11, 19, 27, 34].map((x) => ({ spr: 'int_stool', x, y: 6, solid: false })), { spr: 'int_plant_tall', x: 1, y: 11, shadow: 9 }, { spr: 'int_plant_tall', x: 38, y: 11, shadow: 9 }, { spr: 'int_chabudai', x: 14, y: 9, w: 2, shadow: 14, interact: say('A low table for sharing gyoza. The sauce dish says "do not dip twice".') }],
    warps: [{ x: 19, y: 13, w: 2, h: 1, enter: 'down', to: 'kita_arcade:from_ramen_street' }],
    spawns: { default: [19, 10, 'up'], from_arcade: [19, 12, 'up'] },
    spots: { gen_counter: [4, 2], counter_1: [4, 5], counter_2: [12, 5], counter_3: [20, 5], street: [19, 9], queue: [10, 8] },
  });
}

// ---------------------------------------------------------------- Bookstore (24x14), Game Centre (30x16), Capsule Hotel (24x14)
{
  const g = room(24, 14, 1, 2, 22, 12); g.fill(11, 13, 2, 1, 'd');
  cmap('kita_bookstore', {
    ...IN, name: 'Bunta Books', legend: LG('int_fl_walnut', 'int_wall_clock'), rows: g.rows(),
    objects: [...[1, 3, 5, 14, 16, 18, 20].map((x) => ({ spr: 'kc_shelf_book', x, y: 4, w: 2, h: 2, shadow: 0, interact: say('Secondhand paperbacks, shelved by mood, not by author. A note: "Ask Bunta."') })),
      { spr: 'int_register', x: 10, y: 6, w: 2, shadow: 22, use: 'kc_book_shop' }, { spr: 'int_boxes', x: 18, y: 8, shadow: 14, use: 'kc_book_job' }, { spr: 'int_nook', x: 2, y: 9, w: 2, shadow: 18, use: 'int_nook' },
      { spr: 'int_reading_table', x: 7, y: 9, w: 2, shadow: 20, interact: say('A reading table with a half-solved crossword. Pencil, not pen. Brave.') }, { spr: 'int_lamp', x: 12, y: 9, dx: 8, light: { kind: 'lamp', y: -20 } }, { spr: 'int_plant_tall', x: 22, y: 10, shadow: 9 }],
    warps: [{ x: 11, y: 13, w: 2, h: 1, enter: 'down', to: 'kita_arcade:from_bookstore' }],
    spawns: { default: [11, 10, 'up'], from_arcade: [11, 12, 'up'] },
    spots: { counter: [11, 8, 'up'], nook: [4, 10], shelves: [8, 7], job: [18, 9], door: [11, 11] },
  });
  const g2 = room(30, 16, 1, 2, 28, 14); g2.fill(14, 15, 2, 1, 'd');
  cmap('kita_game_centre', {
    ...IN, name: 'Game Centre Nekoya', bg: '#1a1030', legend: LG('int_fl_carpet_lilac', 'int_wall_mart'), rows: g2.rows(),
    objects: [...[2, 5, 8, 11].map((x) => ({ spr: 'kc_claw', x, y: 4, w: 2, h: 2, shadow: 20, use: 'kc_claw_play', light: { kind: 'vending', y: 10 } })), { spr: 'kc_photo_booth', x: 16, y: 4, w: 2, h: 2, shadow: 14, use: 'kc_puri', light: { kind: 'screen', y: 20 } },
      ...[20, 22, 24, 26].map((x) => ({ spr: 'int_arcade', x, y: 4, h: 2, shadow: 10, use: 'kc_cab', light: { kind: 'screen', y: 10 } })), { spr: 'int_register', x: 24, y: 10, w: 2, shadow: 22, use: 'kc_gc_counter' }, { spr: 'int_gacha', x: 3, y: 10, h: 2, shadow: 10, interact: say('A capsule toy machine. The prizes are tiny cats in tiny hats.') }, { spr: 'int_bench', x: 12, y: 11, w: 2, shadow: 16, use: 'bench' }],
    warps: [{ x: 14, y: 15, w: 2, h: 1, enter: 'down', to: 'kita_arcade:from_game_centre' }],
    spawns: { default: [14, 12, 'up'], from_arcade: [14, 14, 'up'] },
    spots: { counter: [25, 12, 'up'], claws: [6, 7], puri: [17, 7], cabs: [23, 7], door: [14, 13] },
  });
  const g3 = room(24, 14, 1, 2, 22, 12); g3.fill(11, 13, 2, 1, 'd');
  cmap('kita_capsule_hotel', {
    ...IN, name: 'Capsule Hotel Tsuki', legend: LG('int_fl_lino_sky', 'int_wall_post'), rows: g3.rows(),
    objects: [{ spr: 'int_post_counter', x: 3, y: 4, w: 3, shadow: 24, use: 'kc_hotel_desk' }, ...[10, 13, 16, 19].map((x) => ({ spr: 'kc_capsule', x, y: 3, w: 3, h: 2, shadow: 0, interact: { label: 'Capsule', run: (gm) => gm.say('misa', 'happy', 'A snug little pod with a reading light and a curtain. It is like a cosy shelf for a person.') } })),
      { spr: 'kc_locker_row', x: 3, y: 9, w: 3, h: 2, shadow: 0, interact: say('Lockers for your shoes and bags. Mine is number 7. Lucky.') }, { spr: 'int_sofa_back', x: 14, y: 9, w: 2, shadow: 24, use: 'sofa' }, { spr: 'int_tub', x: 18, y: 9, w: 2, shadow: 0, use: 'kc_hotel_bath' }, { spr: 'int_plant_tall', x: 22, y: 3, shadow: 9 }, { spr: 'int_lamp', x: 8, y: 4, dx: 8, light: { kind: 'lamp', y: -20 } }],
    warps: [{ x: 11, y: 13, w: 2, h: 1, enter: 'down', to: 'kita_arcade:from_capsule_hotel' }],
    spawns: { default: [11, 10, 'up'], from_arcade: [11, 12, 'up'], pod: [12, 6, 'down'] },
    spots: { desk: [4, 6, 'up'], lounge: [15, 11], pod: [12, 6], door: [11, 11] },
  });
}
void TP; void spot; void streetlight;
