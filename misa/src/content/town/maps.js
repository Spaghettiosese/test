// The outdoor heart of Hoshimori Bay: Lantern Lane, Hoshimori Square, Sakura Park, the shotengai and the
// Hoshimori High grounds. Doors warp into interiors owned by other areas (see docs/WORLD.md).
import { features } from '../../core/registry.js';
import { townMap, grid, hours } from './lib.js';
import { building, FACADES } from './facade.js';
import { plate, LIGHT } from './props_street.js';
import { P, tree, lamp, streetlight, bench, row, signpost, plaque, snowman, leafpile, spot, clockOverlay, steamOverlay, flagOverlay } from './interactions.js';

plate('town_plate_lane', 'Lantern Lane');
plate('town_plate_square', 'Hoshimori Sq.');
plate('town_plate_shotengai', 'Shotengai');
plate('town_plate_park', 'Sakura Park');
const say = (text) => ({ label: 'Look', run: (g) => g.say(null, null, text) });
const merge = (...bs) => ({ objs: bs.map((b) => b.obj), warps: bs.flatMap((b) => b.warps), spawns: Object.assign({}, ...bs.map((b) => b.spawns)) });

// ---------------------------------------------------------------- Lantern Lane
{
  const g = grid(44, 14, '.');
  g.fill(0, 5, 44, 1, '=').fill(0, 6, 44, 3, '_').fill(0, 9, 44, 1, '=');
  g.fill(5, 0, 3, 5, ':').fill(21, 1, 7, 4, ':').fill(27, 10, 3, 4, '=');
  const B = merge(
    building('town_house_goro', 15, 0, { to: 'goro_house:from_lane', spawn: 'from_goro_house', missingText: 'Goro\'s door. Nobody answers right now.' }),
    building('town_house_blue', 30, 0, { to: 'lane:from_town', locked: '!flag:town_never', lockedText: 'Nobody seems to be home. A note on the door says: gone fishing.' }),
  );
  townMap('lane', {
    name: 'Lantern Lane',
    rows: g.rows(),
    objects: [
      ...B.objs,
      ...row('town_hedge', 0, 3, 4), { spr: 'town_gatepost', x: 4, y: 4, dx: 9 }, { spr: 'town_gatepost', x: 8, y: 4 }, ...row('town_hedge', 9, 12, 4),
      tree('sakura', 1, 2, '_s'), tree('sakura', 10, 2, '_b'),
      P('town_vending', 13, 4, { use: 'vending', light: LIGHT.vending, shadow: 12 }),
      P('town_barrel', 21, 1, { shadow: 7 }),
      P('town_garden_bed', 22, 1, { w: 2 }), P('town_garden_bed', 25, 1, { w: 2 }), P('town_garden_bed', 22, 3, { w: 2 }), P('town_garden_bed', 25, 3, { w: 2 }),
      ...row('town_fence_picket', 21, 23, 4), ...row('town_fence_picket', 25, 27, 4),
      tree('oak', 28, 2, '_s'), tree('oak', 38, 2), tree('pine', 41, 1, '_s'), P('town_bush_flower', 36, 4), P('town_bush', 42, 4),
      streetlight(10, 5), streetlight(29, 5), streetlight(40, 5),
      P('town_kei_truck', 1, 6, { w: 3 }),
      snowman(0, 5), leafpile(20, 9), leafpile(36, 5),
      ...row('town_hedge', 0, 5, 10), P('town_pole', 6, 10), P('town_plate_lane', 7, 10, { interact: plaque('Lantern Lane. Home is through the gate on the north side.') }),
      ...row('town_wall_stone', 8, 20, 10),
      tree('sakura', 10, 13, '_s'), tree('sakura', 15, 13), tree('maple', 19, 12, '_s'), P('town_bush', 12, 11), P('town_bush_azalea', 17, 11),
      P('town_pole', 22, 10), P('town_bush', 23, 10), P('town_bush_flower', 24, 10),
      signpost(26, 10, 'East: Hoshimori Square and the shops. South: Sakura Park. North gate: home.'),
      P('town_mirror', 30, 10),
      P('town_busstop_sign', 32, 9, { use: 'bus_stop', shadow: 6 }), P('town_bus_shelter', 33, 10, { w: 3, use: 'bus_stop' }),
      ...row('town_fence_picket', 36, 37, 10), P('town_pole', 38, 10), ...row('town_fence_picket', 39, 43, 10),
      tree('oak', 40, 13, '_s'), tree('pine', 36, 13, '_s'),
    ],
    warps: [...B.warps, { x: 5, y: 0, w: 3, h: 1, to: 'yard:from_lane' }, { x: 43, y: 5, w: 1, h: 5, to: 'town:from_lane' }, { x: 27, y: 13, w: 3, h: 1, to: 'park:from_lane' }],
    spawns: { default: [6, 7, 'down'], from_yard: [6, 1, 'down'], from_town: [42, 7, 'left'], from_park: [28, 12, 'up'], ...B.spawns },
    spots: { bus_stop: [33, 9], vending: [13, 5], goro_garden: [24, 2], wall: [12, 9], crossroad: [28, 8] },
    wires: [[6, 10], [22, 10], [38, 10]],
    decals: [{ k: 'dashes', x: 0, y: 7, w: 44 }, { k: 'zebra', x: 27, y: 6, w: 3, h: 3 }, { k: 'manhole', x: 18, y: 6 }],
  });
}

// ---------------------------------------------------------------- Hoshimori Square
{
  const g = grid(46, 32, '.');
  g.fill(0, 7, 46, 2, '=').fill(0, 9, 46, 3, '_').fill(0, 12, 46, 1, '=');
  g.fill(3, 0, 3, 7, '_').fill(40, 0, 3, 7, 'g');
  g.fill(6, 13, 34, 13, '+').fill(20, 26, 5, 6, '_').fill(19, 26, 1, 6, '=').fill(25, 26, 1, 6, '=').fill(0, 18, 6, 3, '=');
  g.blob(2, 27, 2, 1, ',').blob(42, 28, 2, 2, ',');
  const clock = building('town_clockshop', 21, 0, { to: 'clock_shop:from_town', spawn: 'from_clock_shop', hours: hours({ open: '09:00', close: '19:00' }), litUntil: 21 * 60, shop: true });
  clock.obj.overlay = clockOverlay(FACADES.town_clockshop.clock[0], FACADES.town_clockshop.clock[1], FACADES.town_clockshop.H);
  const B = merge(
    building('town_library', 6, 1, { to: 'library:from_town', spawn: 'from_library', hours: hours({ open: '09:00', close: '20:00' }), litUntil: 20 * 60 + 30, shop: true }),
    building('town_cafe', 14, 3, { to: 'cafe:from_town', spawn: 'from_cafe', hours: hours({ open: '07:00', close: '22:00' }), litUntil: 22 * 60, shop: true }),
    clock,
    building('town_mart', 27, 3, { to: 'mart:from_town', spawn: 'from_mart', hours: hours({ open: '07:00', close: '23:00' }), litUntil: 23 * 60, shop: true }),
    building('town_post', 34, 2, { to: 'post_office:from_town', spawn: 'from_post_office', hours: hours({ open: '09:00', close: '18:00', closedOn: 'sun' }), litUntil: 18 * 60 + 30, shop: true }),
  );
  const stall = (spr, x) => P(spr, x, 20, { w: 2, when: 'day:sat&time<17:00', use: 'shop_market', shadow: 22 });
  townMap('town', {
    name: 'Hoshimori Square',
    rows: g.rows(),
    objects: [
      ...B.objs,
      tree('oak', 1, 3), tree('pine', 1, 6, '_s'), tree('sakura', 13, 5, '_s'), tree('maple', 20, 5, '_s'), tree('oak', 26, 5, '_s'), tree('pine', 33, 5, '_s'), tree('pine', 44, 2), tree('oak', 44, 5, '_s'),
      ...[[39, 1], [43, 1], [39, 4], [43, 4]].map(([x, y]) => P('town_stone_lantern', x, y, { light: LIGHT.stone, shadow: 8 })),
      P('town_terrace', 14, 7, { w: 2, shadow: 14 }), P('town_chalkboard', 16, 7, { solid: false, interact: plaque('Today at Cafe Kumo: honey toast, hojicha latte, and a cozy corner for you.') }), P('town_terrace', 18, 7, { w: 2, shadow: 14 }),
      streetlight(13, 7), streetlight(20, 7), streetlight(26, 7), streetlight(33, 7), streetlight(39, 7),
      P('town_bikerack', 23, 7, { w: 2, use: 'town_bikebell' }), P('town_vending', 32, 7, { use: 'vending', light: LIGHT.vending, shadow: 12 }), P('town_postbox', 38, 7, { shadow: 7, interact: plaque('Collection times: 10:00 AM and 4:00 PM. Letters to the city take two days.') }),
      signpost(2, 8, 'North: Hoshimori High. North-east: Hoshi Hill Shrine. West: Lantern Lane. East: the shotengai. South: the harbour.'),
      P('town_plate_square', 6, 12, { interact: plaque('Hoshimori Square. Meet you at the fountain!') }), streetlight(16, 12), streetlight(28, 12),
      P('town_busstop_sign', 35, 12, { use: 'bus_stop', shadow: 6 }), P('town_bus_shelter', 36, 13, { w: 3, use: 'bus_stop' }),
      P('town_fountain', 21, 17, { w: 3, h: 2, use: 'fountain' }),
      lamp(19, 16), lamp(25, 16), lamp(19, 20), lamp(25, 20),
      P('town_noticeboard', 12, 14, { w: 2, use: 'noticeboard', shadow: 22 }),
      bench(17, 22), bench(26, 22), bench(41, 18),
      P('town_stage', 32, 14, { w: 5, h: 2, interact: plaque('The festival stage. Next show: watch the noticeboard!') }),
      stall('town_stall_veg', 8), stall('town_stall_fruit', 11), stall('town_stall_flower', 14),
      { ...P('town_ramen_cart', 30, 23, { w: 3, when: 'time>=18:00', use: 'shop_ramen', light: LIGHT.cart, shadow: 30 }), overlay: steamOverlay(60, 30, 70) },
      P('town_planter', 6, 13), P('town_planter', 39, 13), P('town_planter', 6, 25), P('town_planter', 39, 25),
      tree('sakura', 8, 16), tree('sakura', 37, 20, '_b'), tree('maple', 8, 24, '_s'), tree('oak', 37, 24, '_s'),
      P('town_flowerbed', 15, 25, { w: 2, use: 'town_flowers' }), P('town_flowerbed', 27, 25, { w: 2, use: 'town_flowers' }),
      P('town_bunting', 13, 16, { w: 6, solid: false, when: 'flag:festival_today', depth: 400, dy: -26 }),
      P('town_bunting', 25, 16, { w: 6, solid: false, when: 'flag:festival_today', depth: 400, dy: -26 }),
      snowman(10, 17), snowman(29, 19), leafpile(30, 16), leafpile(9, 13), leafpile(41, 22),
      tree('oak', 2, 15), tree('maple', 4, 23, '_s'), tree('pine', 1, 24, '_s'), P('town_bush_flower', 4, 14), P('town_bush', 0, 21),
      tree('oak', 43, 15), tree('sakura', 43, 22, '_s'), P('town_bush_azalea', 40, 14), P('town_bins', 44, 12),
      ...row('town_hedge', 6, 18, 26), ...row('town_hedge', 26, 39, 26),
      tree('oak', 10, 29), tree('maple', 32, 29), tree('sakura', 15, 30, '_s'), tree('pine', 37, 30, '_s'), tree('oak', 3, 29, '_s'), tree('pine', 43, 30, '_s'),
      streetlight(19, 28), streetlight(25, 29),
    ],
    warps: [
      ...B.warps,
      { x: 0, y: 7, w: 1, h: 6, to: 'lane:from_town' }, { x: 45, y: 7, w: 1, h: 6, to: 'shotengai:from_town' },
      { x: 3, y: 0, w: 3, h: 1, to: 'school_grounds:from_town' }, { x: 40, y: 0, w: 3, h: 1, to: 'shrine:from_town', missingText: 'The shrine steps are being swept. Come back soon.' },
      { x: 20, y: 31, w: 5, h: 1, to: 'harbour:from_town', missingText: 'Road works on the harbour road. Come back soon.' }, { x: 0, y: 18, w: 1, h: 3, to: 'park:from_town' },
    ],
    spawns: { default: [22, 20, 'down'], from_lane: [1, 10, 'right'], from_shotengai: [44, 10, 'left'], from_school_grounds: [4, 1, 'down'], from_shrine: [41, 1, 'down'], from_harbour: [22, 30, 'up'], from_park: [1, 19, 'right'], ...B.spawns },
    spots: { fountain: [22, 19], noticeboard: [13, 15], bench_1: [17, 23], bench_2: [27, 23], clocktower: [21, 8], stage: [34, 16], market_1: [9, 21], market_2: [12, 21], bus_stop: [35, 13], ramen_cart: [31, 24], cafe_terrace: [16, 8] },
    decals: [{ k: 'dashes', x: 0, y: 10, w: 46 }, { k: 'zebra', x: 11, y: 9, w: 2, h: 3 }, { k: 'zebra', x: 28, y: 9, w: 2, h: 3 }, { k: 'zebra', x: 40, y: 9, w: 3, h: 3 },
      { k: 'vdashes', x: 22, y: 26, h: 6 }, { k: 'manhole', x: 15, y: 10 }, { k: 'manhole', x: 36, y: 9 }, { k: 'rosette', x: 22, y: 18 }],
  });
}

// ---------------------------------------------------------------- Sakura Park
{
  const g = grid(40, 28, '.');
  g.blob(8, 14, 4, 3, '~').blob(11, 15, 2, 2, '~').fill(7, 17, 2, 11, '~').fill(7, 20, 2, 2, 'B');
  g.fill(2, 5, 9, 3, '"').fill(6, 5, 2, 5, ':').fill(20, 0, 2, 10, ':').fill(6, 9, 32, 2, ':').fill(36, 9, 2, 6, ':').fill(36, 12, 4, 3, ':');
  g.fill(14, 11, 2, 11, ':').fill(2, 20, 28, 2, ':').fill(29, 7, 2, 2, ':');
  g.fill(26, 12, 9, 5, '"').fill(28, 18, 9, 8, 's').blob(34, 4, 3, 2, ',').blob(23, 25, 3, 2, ',').blob(2, 24, 2, 3, ',');
  const pines = building('town_sunny_pines', 2, 0, { to: 'sunny_pines:from_park', spawn: 'from_sunny_pines', missingText: 'Sunny Pines. Visiting hours start soon.' });
  townMap('park', {
    name: 'Sakura Park', music: 'town',
    rows: g.rows(),
    objects: [
      pines.obj,
      ...row('town_hedge', 2, 5, 7), ...row('town_hedge', 8, 10, 7), P('town_flowerbed', 3, 5, { w: 2, use: 'town_flowers' }), P('town_flowerbed', 9, 5, { w: 2, use: 'town_flowers' }),
      tree('pine', 0, 2, '_s'), tree('pine', 12, 2), tree('maple', 15, 3, '_s'), tree('oak', 24, 3), tree('pine', 36, 2), tree('pine', 38, 5, '_s'),
      P('town_bandstand', 27, 5, { w: 5, h: 2, interact: plaque('The bandstand. Brass band concerts on festival days.') }),
      P('town_chess', 17, 7, { w: 2, use: 'town_chess', shadow: 18 }),
      bench(22, 7), bench(33, 11), bench(10, 19), bench(2, 18),
      lamp(12, 8), lamp(25, 8), lamp(35, 8), lamp(16, 13), lamp(13, 22), lamp(27, 22),
      tree('sakura', 3, 10), tree('sakura', 13, 12, '_b'), tree('sakura', 17, 15, '_s'), tree('sakura', 2, 15, '_s'), tree('sakura', 10, 25, '_s'),
      tree('oak', 19, 18, '_b'), tree('maple', 24, 16, '_s'), tree('maple', 38, 18), tree('oak', 20, 25), tree('pine', 1, 26, '_s'), tree('oak', 15, 25, '_s'), tree('maple', 33, 26, '_s'),
      P('town_flowerbed', 17, 12, { w: 2, use: 'town_flowers' }), P('town_bush_azalea', 5, 11), P('town_bush_flower', 12, 18), P('town_bush', 22, 13), P('town_bush', 37, 24),
      P('town_bridge_deck', 6, 20, { w: 4, h: 2, flat: true, solid: false }),
      P('town_swings', 29, 19, { w: 3, use: 'town_swing' }), P('town_slide', 33, 19, { w: 2, use: 'town_slide' }), P('town_sandbox', 30, 23, { w: 2, flat: true, solid: false }),
      P('town_plate_park', 38, 11, { interact: plaque('Sakura Park. Please be kind to the ducks.') }),
      signpost(22, 11, 'North: Lantern Lane. East: Hoshimori Square. West: Sunny Pines.'),
      spot(10, 17, { interact: { label: 'Look at the pond', run: (gm) => gm.say('misa', 'happy', gm.season === 'winter' ? 'The pond is frozen solid. The koi are sleeping under the ice.' : 'Orange koi glide under the surface. One blows a bubble at me.') } }),
      snowman(24, 11), snowman(31, 15), leafpile(18, 10), leafpile(27, 21), leafpile(5, 19),
    ],
    warps: [...pines.warps, { x: 19, y: 0, w: 3, h: 1, to: 'lane:from_park' }, { x: 39, y: 12, w: 1, h: 3, to: 'town:from_park' }],
    spawns: { default: [20, 9, 'down'], from_lane: [20, 1, 'down'], from_town: [38, 13, 'left'], ...pines.spawns },
    spots: { pond_edge: [10, 18], bench: [10, 20], chess_table: [17, 8], playground: [32, 21], lawn: [30, 14], bandstand: [29, 8], sakura_tree: [13, 13], bridge: [7, 21] },
  });
}

// ---------------------------------------------------------------- Hoshimori Shotengai (covered shopping street)
{
  const g = grid(44, 14, '=');
  g.fill(0, 12, 44, 2, 'W').fill(38, 0, 6, 4, '.');
  const shops = [['town_shop_salon', 2], ['town_shop_clinic', 8], ['town_shop_woodworks', 14], ['town_shop_wagashi', 20], ['town_shop_books', 26], ['town_shop_tea', 32]].map(([s, x]) => building(s, x, 0, { litUntil: 21 * 60, shop: true }));
  const doorAt = (x) => [x, 4];
  townMap('shotengai', {
    name: 'Hoshimori Shotengai',
    rows: g.rows(),
    arcade: [5, 10],
    objects: [
      ...shops.map((b) => b.obj),
      spot(...doorAt(5), { use: 'shop_salon' }), spot(...doorAt(10), { use: 'shop_clinic' }), spot(...doorAt(15), { use: 'shop_woodworks' }),
      spot(...doorAt(22), { interact: say('Wagashi in the window: sakura mochi, dorayaki and little rabbit-shaped buns. The shop is closed for a family holiday.') }),
      spot(...doorAt(30), { interact: say('A secondhand bookshop. A cat is asleep on a stack of star atlases in the window.') }),
      spot(...doorAt(34), { interact: say('The tea house smells of roasted hojicha. A sign says: tasting days are on the noticeboard.') }),
      tree('pine', 41, 1, '_s'), P('town_vending', 39, 4, { use: 'vending', light: LIGHT.vending, shadow: 12 }), P('town_bins', 41, 4),
      { ...P('town_stall_flower', 39, 6, { w: 2, when: 'day:fri', use: 'shop_stall', shadow: 22 }) },
      ...[1, 7, 13, 19, 25, 31, 37, 43].map((x) => P('town_arcade_pillar', x, 11, { shadow: 6 })),
      ...[3, 9, 15, 21, 27, 33].map((x) => P('town_lanterns', x, 5, { w: 3, solid: false, depth: 500, dy: -16, light: { kind: 'lantern', x: 24, y: -8 } })),
      bench(3, 11), bench(27, 11), P('town_planter', 9, 11), P('town_planter', 15, 11), P('town_planter', 21, 11), P('town_planter', 33, 11), P('town_planter', 39, 11),
      P('town_pot_a', 7, 4, { solid: false }), P('town_pot_b', 13, 4, { solid: false }), P('town_pot_c', 25, 4, { solid: false }), P('town_crates', 19, 4, { solid: false }),
      P('town_plate_shotengai', 0, 4, { interact: plaque('Hoshimori Shotengai. Covered from the rain since long before you were born.') }),
      P('town_bikerack', 23, 11, { w: 2, use: 'town_bikebell' }),
      snowman(41, 9), leafpile(12, 9),
    ],
    warps: [{ x: 0, y: 5, w: 1, h: 6, to: 'town:from_shotengai' }],
    spawns: { default: [6, 8, 'down'], from_town: [1, 8, 'right'] },
    spots: { salon: [5, 5], clinic: [10, 5], woodworks: [15, 5], stall: [40, 7], arcade: [22, 8], lantern_row: [28, 7] },
    decals: [{ k: 'tiles', x: 0, y: 7, w: 44, h: 2 }],
  });
}

// ---------------------------------------------------------------- Hoshimori High: field, gym, greenhouse and garden
{
  const g = grid(40, 28, '.');
  g.fill(1, 6, 30, 3, '=').fill(18, 9, 4, 19, '=').fill(1, 10, 17, 11, '"').fill(31, 8, 7, 4, ':').fill(23, 23, 4, 3, '=');
  g.blob(36, 20, 2, 2, ',').blob(28, 26, 3, 1, ',');
  const B = merge(
    building('town_school', 2, 0, { to: 'school_halls:from_school_grounds', spawn: 'from_school_halls', locked: { any: ['time<07:00', 'time>=20:00'] }, lockedText: 'The school is locked for the night.', litUntil: 19 * 60, shop: true }),
    building('town_gym', 20, 1, { to: 'gym:from_school_grounds', spawn: 'from_gym', locked: { any: ['time<07:00', 'time>=20:00'] }, lockedText: 'The gym is locked for the night.', litUntil: 20 * 60, shop: true }),
  );
  townMap('school_grounds', {
    name: 'Hoshimori High',
    rows: g.rows(),
    objects: [
      ...B.objs,
      P('town_greenhouse', 31, 4, { w: 5, h: 2, interact: plaque('The school greenhouse. Tomato seedlings in neat rows, each with a name tag.') }),
      P('town_garden_bed', 31, 8, { w: 2 }), P('town_garden_bed', 34, 8, { w: 2 }), P('town_garden_bed', 31, 10, { w: 2 }), P('town_garden_bed', 34, 10, { w: 2 }),
      P('town_barrel', 37, 8, { shadow: 7 }),
      { ...P('town_flagpole', 17, 6), overlay: flagOverlay },
      P('town_goal', 3, 15, { shadow: 8 }), P('town_goal', 15, 15, { flip: true, shadow: 8 }),
      bench(23, 14), bench(28, 18),
      P('town_bikerack', 23, 24, { w: 2, use: 'town_bikebell' }), P('town_bins', 26, 7),
      P('town_gate_pillar', 17, 25, { interact: plaque('Hoshimori High School. "Look up, and keep going."') }), P('town_gate_pillar', 22, 25),
      tree('sakura', 22, 11, '_s'), tree('sakura', 22, 17, '_s'), tree('sakura', 17, 22, '_s'), tree('sakura', 6, 23, '_s'),
      tree('pine', 38, 1), tree('pine', 36, 3, '_s'), tree('oak', 37, 14), tree('maple', 30, 21), tree('oak', 34, 24, '_s'), tree('sakura', 1, 25, '_s'), tree('maple', 12, 25, '_s'), tree('pine', 0, 3, '_s'),
      ...row('town_hedge', 1, 16, 21), P('town_bush_azalea', 25, 12), P('town_bush', 31, 15), P('town_bush_flower', 3, 26),
      lamp(22, 14), lamp(22, 20), lamp(22, 23), streetlight(14, 7), streetlight(28, 7),
      snowman(25, 20), leafpile(20, 15), leafpile(33, 13),
    ],
    warps: [...B.warps, { x: 18, y: 27, w: 4, h: 1, to: 'town:from_school_grounds' }],
    spawns: { default: [19, 12, 'down'], from_town: [19, 26, 'up'], ...B.spawns },
    spots: { gate: [20, 24], field_center: [9, 15], goal: [5, 15], greenhouse: [33, 6], garden: [33, 9], bench: [24, 15], bike_rack: [25, 25], track: [9, 10] },
    decals: [{ k: 'track', x: 1, y: 10, w: 17, h: 11 }],
  });
}

features('Town and travel', [
  'Garden plots in the front yard (6x4 tiles of soil) ready for planting',
  'Kuro the stray kitten\'s secret gap in the yard hedge',
  'Goro\'s vegetable beds on Lantern Lane grow, ripen and rest under snow with the seasons',
  'Cafe Kumo\'s terrace: parasol tables and a chalkboard menu on the pavement',
  'Peek into the shotengai shop windows: wagashi sweets, a secondhand bookshop and a tea house',
  'Read the plaques: post box collection times, the school motto, the stage and bandstand notices',
  'Stone lanterns line the approach to Hoshi Hill Shrine and glow at dusk',
  'Bus shelters with timetables on Lantern Lane and in the square',
  'A neighbour\'s house on Lantern Lane with a gone-fishing note on the door',
  'Chess table in the park with a game left halfway',
  'Koi pond with a stream and a red footbridge in Sakura Park',
  'Wildflower meadows dotted around the park, the square and the school',
]);
