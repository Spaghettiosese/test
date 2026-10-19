// Mount Tsukimi (trailhead, forest, falls, summit), Yukemuri village and the mountain interiors (ryokan lobby/room, onsen bath, hut).
import { townMap, grid, prop } from '../town/lib.js';
import { building, FACADES } from '../town/facade.js';
import { P, tree, lamp, streetlight, bench, signpost, row } from '../town/interactions.js';
import { LIGHT } from '../town/props_street.js';
import './art.js';
import { MLEGEND, scatter, trail, interior, steam, merge } from './kit.js';
import { SV4, badge } from './data.js';

const doorOf = (name, x, y) => { const f = FACADES[name], d = f.doors[0]; return [x + Math.floor((d.x + d.w / 2) / 32), y + f.hT]; };
const first = (id, key, text) => (g) => { const S = SV4(g); if (S && !S.visited[id]) { S.visited[id] = 1; g.stat('regionPlaces'); if (key) g.toast(text, 'i_map'); } };

// ------------------------------------------------------------------ trailhead 36x24
{
  const g = grid(36, 24, '.');
  g.fill(0, 0, 36, 3, 'T').fill(0, 0, 2, 24, 'T').fill(34, 0, 2, 24, 'T');
  g.fill(16, 0, 3, 12, ':').fill(3, 12, 11, 9, '_').fill(14, 12, 12, 6, '+').fill(26, 11, 10, 3, 'g').fill(16, 18, 3, 6, '=').fill(14, 14, 1, 1, '+');
  const tea = building('tk_teastall', 20, 8, {});
  tea.obj.use = 'sv4_shop_tea';
  const objs = [
    tea.obj, P('tk_register', 12, 10, { w: 2, use: 'tk_register', shadow: 18 }),
    P('tk_bellpost', 15, 4, { use: 'tk_bell', shadow: 6 }), P('tk_bellpost', 19, 4, { use: 'tk_bell', shadow: 6 }),
    P('tk_sign', 19, 13, { use: 'tk_trailmap', shadow: 6 }),
    P('tk_car_a', 4, 14, { w: 2, shadow: 24 }), P('tk_car_b', 7, 14, { w: 2, shadow: 24 }), P('tk_car_c', 10, 17, { w: 2, shadow: 24 }),
    P('town_busstop_sign', 27, 14, { use: 'sv4_bus', shadow: 6 }), P('town_vending', 25, 9, { use: 'vending', light: LIGHT.vending, shadow: 12 }),
    bench(15, 16), bench(22, 16), lamp(14, 12), lamp(25, 12),
    P('tk_ropeway', 29, 6, { w: 3, h: 3, use: 'tk_ropeway', shadow: 0 }), P('tk_shelter', 5, 8, { w: 2, h: 2, use: 'tk_shelter_rest', shadow: 0 }),
    P('town_snowman', 28, 15, { when: 'season:winter', shadow: 8 }),
  ];
  objs.push(...scatter(g.rows(), objs, { seed: 3 }));
  townMap('tsukimi_trailhead', {
    name: 'Tsukimi Trailhead', music: 'shrine', bg: '#10201a', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 16, y: 0, w: 3, to: 'tsukimi_forest:from_tsukimi_trailhead' }, { x: 16, y: 23, w: 3, to: 'town:from_tsukimi_trailhead' }, { x: 35, y: 11, h: 3, to: 'yukemuri_village:from_tsukimi_trailhead' }],
    spawns: { default: [17, 14, 'down'], from_town: [17, 22, 'up'], from_tsukimi_forest: [17, 3, 'down'], from_yukemuri_village: [33, 12, 'left'] },
    spots: { bus_stop: [26, 15], tea_stall: [21, 12], register: [12, 12], bear_bell: [17, 5], trail_start: [17, 6], carpark: [8, 16], bench: [16, 18], ropeway: [30, 10], east_road: [30, 12], sign: [20, 14], shelter: [6, 11] },
    onEnter: first('tsukimi_trailhead'),
  });
}
// ------------------------------------------------------------------ forest 30x56
{
  const g = grid(30, 56, '.');
  g.fill(0, 0, 2, 56, 'T').fill(29, 0, 1, 56, 'T').fill(0, 0, 30, 2, 'T');
  trail(g, [[15, 55], [15, 47], [7, 47], [7, 39], [22, 39], [22, 32], [8, 32], [8, 22], [20, 22], [20, 14], [14, 14], [14, 0]]);
  g.fill(0, 23, 8, 3, ':').fill(22, 35, 7, 3, ':').fill(2, 27, 26, 2, '~').fill(7, 27, 3, 2, 'D');
  g.blob(23, 44, 3, 3, '"').blob(4, 35, 3, 3, ',').blob(22, 26, 3, 2, ',').blob(5, 15, 3, 3, ',');
  const hut = building('tk_hut', 24, 31, { to: 'mountain_hut:from_tsukimi_forest', spawn: 'from_mountain_hut' });
  const deck = [];
  for (const x of [7, 8, 9]) for (const y of [27, 28]) deck.push({ spr: 'tk_plank', x, y, flat: true, solid: false });
  const objs = [
    hut.obj, ...deck, { spr: 'tk_rope_rail', x: 7, y: 26, solid: false, depth: 5 }, { spr: 'tk_rope_rail', x: 9, y: 26, solid: false }, { spr: 'tk_rope_rail', x: 7, y: 29, solid: false }, { spr: 'tk_rope_rail', x: 9, y: 29, solid: false },
    P('tk_shelter', 9, 43, { w: 2, h: 2, use: 'tk_shelter_rest' }), P('tk_shelter', 16, 18, { w: 2, h: 2, use: 'tk_shelter_rest' }),
    P('tk_bellpost', 13, 50, { use: 'tk_bell', shadow: 6 }), P('tk_bellpost', 17, 12, { use: 'tk_bell', shadow: 6 }),
    signpost(17, 52, 'Tsukimi trail. West branch: Tsukimi Falls, 20 minutes. North: summit lookout. East hut: tea and bunks. Carry a bear bell!'),
    signpost(5, 24, 'Falls branch. Mind the slippery rocks.'), bench(10, 48),
    P('coast_rock_m', 11, 36, { w: 1, shadow: 14 }), P('coast_rock_l', 18, 50, { w: 2, shadow: 20 }), P('coast_rock_m', 4, 20, { shadow: 14 }), P('coast_rock_s', 25, 18, { shadow: 8 }),
    { x: 5, y: 33, w: 1, h: 1, solid: false, use: 'tk_forage_hint' },
  ];
  objs.push(...scatter(g.rows(), objs, { seed: 8, dens: 0.34 }));
  townMap('tsukimi_forest', {
    name: 'Tsukimi Forest', music: 'shrine', bg: '#10201a', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 14, y: 55, w: 3, to: 'tsukimi_trailhead:from_tsukimi_forest' }, { x: 13, y: 0, w: 3, to: 'tsukimi_summit:from_tsukimi_forest' }, { x: 0, y: 23, h: 3, to: 'tsukimi_falls:from_tsukimi_forest' }, ...hut.warps],
    spawns: { default: [15, 53, 'up'], from_tsukimi_trailhead: [15, 54, 'up'], from_tsukimi_falls: [2, 24, 'right'], from_tsukimi_summit: [14, 2, 'down'], ...hut.spawns },
    spots: { start: [15, 53], bridge: [8, 30], deer_glade: [23, 44], forage_glade: [4, 35], hut_door: [26, 36], shelter_1: [9, 45], shelter_2: [16, 20], falls_branch: [3, 24], summit_trail: [14, 3], junction: [15, 47], stream_bank: [12, 29] },
    onEnter: first('tsukimi_forest'),
  });
}
// ------------------------------------------------------------------ falls 28x24
{
  const g = grid(28, 24, '.');
  g.fill(0, 0, 2, 24, 'T').fill(26, 0, 2, 24, 'T').fill(0, 22, 28, 2, 'T').fill(0, 0, 28, 1, 'T').fill(2, 1, 24, 6, 'S');
  g.blob(13, 10, 6, 3, '~').fill(3, 2, 6, 4, 'g').fill(5, 6, 1, 1, 'g').fill(2, 7, 5, 3, 'g').fill(21, 10, 6, 3, ':').fill(26, 10, 2, 3, ':');
  const objs = [
    { spr: 'tk_falls_0', sprFn: (gm) => `tk_falls_${Math.floor(gm.clock * 4) % 2}`, x: 12, y: 3, w: 3, h: 4, shadow: 0 },
    { spr: 'yk_pool_cave', x: 4, y: 3, w: 3, h: 2, flat: true, fp: [4, 3, 3, 2], use: 'yk_soak_cave', when: 'flag:sv4_cave' },
    { spr: 'tk_boulder', x: 5, y: 6, solid: false, use: 'tk_cave_boulder', when: '!flag:sv4_cave' },
    P('sv_rock_crystal', 3, 2, { use: 'tk_prospect', shadow: 10 }), P('sv_rock_gem', 8, 2, { use: 'tk_prospect', shadow: 10 }),
    P('coast_rock_m', 21, 7, { use: 'tk_prospect', shadow: 14 }), P('coast_rock_l', 3, 17, { w: 2, shadow: 20 }), P('coast_rock_s', 22, 18, { shadow: 8 }),
    P('tk_mat', 21, 15, { w: 1, use: 'tk_meditate', shadow: 10 }), bench(8, 17),
    signpost(24, 13, 'Tsukimi Falls. The rock on the east shore is for sitting quietly.'),
  ];
  for (const [x, y] of [[8, 14], [11, 15], [15, 15], [18, 14]]) objs.push(P('coast_rock_s', x, y, { solid: false }));
  objs.push(...scatter(g.rows(), objs, { seed: 15, dens: 0.18 }));
  townMap('tsukimi_falls', {
    name: 'Tsukimi Falls', music: 'shrine', bg: '#10201a', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 27, y: 10, h: 3, to: 'tsukimi_forest:from_tsukimi_falls' }],
    spawns: { default: [24, 11, 'left'], from_tsukimi_forest: [25, 11, 'left'] },
    spots: { pool: [13, 15], entrance: [26, 11], meditate: [21, 16], cave: [5, 7], cave_spring: [4, 5], fall_view: [13, 8] },
    onEnter(game) { first('tsukimi_falls')(game); badge(game, 'falls'); },
  });
}
// ------------------------------------------------------------------ summit 24x28
{
  const g = grid(24, 28, 'S');
  g.fill(10, 18, 5, 10, 'g').fill(3, 3, 18, 15, 'g').blob(6, 14, 2, 1, ',').blob(17, 7, 2, 1, ',').fill(10, 16, 5, 2, 'g');
  const objs = [
    P('tk_hokora', 11, 3, { w: 2, h: 2, use: 'tk_shrine', shadow: 0, light: LIGHT.stone }), P('tk_telescope', 7, 6, { use: 'tk_telescope', shadow: 8 }), P('tk_cairn', 16, 5, { use: 'tk_cairn', shadow: 8 }),
    bench(13, 9), P('coast_lantern', 9, 4, { light: LIGHT.stone, shadow: 6 }), P('coast_lantern', 15, 3, { light: LIGHT.stone, shadow: 6 }),
    P('tk_ropeway', 17, 11, { w: 3, h: 3, use: 'tk_ropeway', shadow: 0 }), P('tk_ski_gate', 4, 12, { w: 2, h: 1, use: 'tk_ski_start', when: 'season:winter', shadow: 0 }),
    { x: 10, y: 9, w: 3, h: 1, solid: false, use: 'tk_horizon' }, P('coast_rock_m', 6, 10, { shadow: 14 }), P('coast_rock_m', 19, 15, { shadow: 14 }), P('coast_rock_s', 4, 4, { use: 'tk_prospect', shadow: 8 }),
    ...[[4, 6], [5, 9], [14, 12], [8, 15], [18, 5], [11, 13]].map(([x, y]) => ({ spr: 'tk_snow_patch', x, y, w: 2, flat: true, solid: false, when: 'season:winter' })),
  ];
  townMap('tsukimi_summit', {
    name: 'Tsukimi Summit', music: 'shrine', bg: '#101830', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 11, y: 27, w: 3, to: 'tsukimi_forest:from_tsukimi_summit' }],
    spawns: { default: [12, 24, 'up'], from_tsukimi_forest: [12, 26, 'up'] },
    spots: { lookout: [11, 10], telescope: [8, 7], shrine: [11, 6], cairn: [16, 6], ski_start: [5, 13], ropeway: [18, 15], bench: [14, 10], entrance: [12, 26], star_view: [10, 12] },
    onEnter(game) { first('tsukimi_summit')(game); badge(game, 'summit'); },
  });
}
// ------------------------------------------------------------------ Yukemuri village 60x40
{
  const g = grid(60, 40, '.');
  g.fill(0, 0, 60, 2, 'T').fill(0, 38, 60, 2, 'T').fill(0, 0, 2, 40, 'T').fill(58, 0, 2, 40, 'T');
  g.fill(0, 19, 60, 3, '=').fill(3, 22, 3, 7, '=').fill(54, 22, 3, 7, '=').fill(3, 29, 54, 3, '=').fill(34, 22, 19, 7, '+').fill(37, 23, 6, 4, '~').fill(48, 2, 8, 7, ':').fill(53, 5, 3, 3, '~');
  const B = [
    building('yk_ryokan_a', 4, 11, { to: 'ryokan_lobby:from_yukemuri_village', spawn: 'from_ryokan_lobby', shop: true }),
    building('yk_ryokan_b', 14, 11, {}), building('yk_ryokan_c', 44, 11, {}), building('yk_ryokan_d', 7, 24, {}),
    building('yk_bathhouse', 34, 11, { to: 'onsen_bath:from_yukemuri_village', spawn: 'from_onsen_bath', hours: { locked: { any: ['time<08:00', 'time>=22:00'] }, lockedText: 'The public bath is open 8 AM to 10 PM.' } }),
    building('yk_shop_souv', 17, 25, {}), building('yk_shop_egg', 22, 25, {}), building('yk_shop_manju', 27, 25, {}),
  ];
  B[5].obj.use = 'sv4_shop_souv'; B[6].obj.use = 'sv4_shop_egg'; B[7].obj.use = 'sv4_shop_egg';
  const closed = (n) => ({ interact: { label: 'Ryokan', run: (gm) => gm.say(null, null, `${n} is fully booked tonight. A sign reads: Kitsune-no-Yu has rooms for day-trippers.`) } });
  Object.assign(B[1].obj, closed('Tsuru Inn')); Object.assign(B[2].obj, closed('Hoshi Inn')); Object.assign(B[3].obj, closed('Matsu Inn'));
  for (const [nm, x, y] of [['yk_ryokan_a', 4, 11], ['yk_ryokan_b', 14, 11], ['yk_ryokan_c', 44, 11], ['yk_bathhouse', 34, 11]]) { const d = doorOf(nm, x, y); g.fill(d[0] - 1, d[1], 3, 19 - d[1], '='); }
  g.fill(24, 15, 3, 4, '=');
  const M = merge(...B);
  const objs = [
    ...M.objs, P('tk_ropeway', 24, 12, { w: 3, h: 3, use: 'tk_ropeway', shadow: 0 }),
    P('town_busstop_sign', 8, 22, { use: 'sv4_bus', shadow: 6 }),
    ...[6, 16, 28, 32, 44, 56].map((x) => streetlight(x, 18)), ...[12, 20, 28, 46].map((x) => P('yk_lantern_post', x, 22, { light: LIGHT.lantern, shadow: 4 })),
    { ...P('yk_vent', 20, 17, { shadow: 10 }), overlay: steam(16, 8), use: 'yk_vent' }, { ...P('yk_vent', 33, 23, { shadow: 10 }), overlay: steam(16, 8), use: 'yk_vent' }, { ...P('yk_vent', 30, 33, { shadow: 10 }), overlay: steam(16, 8), use: 'yk_vent' },
    { spr: 'yk_sulfur_stain', x: 19, y: 18, solid: false, flat: true },
    P('yk_footbath_bench', 37, 27, { w: 2, use: 'yk_footbath', shadow: 0 }), P('yk_footbath_bench', 40, 27, { w: 2, use: 'yk_footbath', shadow: 0 }),
    { ...P('yk_cat_house', 46, 24, { w: 2, h: 2, use: 'yk_cat_house' }), },
    P('yk_sled', 50, 4, { use: 'yk_sled', shadow: 6 }), P('coast_rock_m', 52, 5, { shadow: 12 }), P('coast_rock_s', 56, 7, { shadow: 8 }), P('yk_towel_rack', 36, 22, { w: 2, shadow: 10 }),
    bench(30, 20), P('town_noticeboard', 14, 22, { w: 2, use: 'sv4_region_board', shadow: 18 }),
    { spr: 'town_stone_lantern', x: 33, y: 17, light: LIGHT.stone },
  ];
  for (const x of [8, 18, 30, 40, 52]) objs.push({ spr: 'ev_lanterns_winter_dummy', x, y: 17, solid: false, when: 'flag:festival_yk_lantern_snow' });
  objs.length -= 5; // (festival lanterns come from the festival decor list)
  objs.push(...scatter(g.rows(), objs, { seed: 31, dens: 0.2 }));
  townMap('yukemuri_village', {
    name: 'Yukemuri Village', music: 'town', bg: '#10201a', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 0, y: 19, h: 3, to: 'tsukimi_trailhead:from_yukemuri_village' }, ...M.warps],
    spawns: { default: [4, 20, 'right'], from_tsukimi_trailhead: [2, 20, 'right'], ...M.spawns },
    spots: { bus_stop: [8, 23], ryokan_door: [8, 18], bath_door: [37, 19], souvenir: [19, 30], egg_stand: [24, 30], vent_1: [20, 18], plaza: [44, 28], footbath: [39, 28], cat_house: [46, 26], sled_start: [49, 5], monkey_pool: [52, 7], ropeway: [25, 16], street_w: [3, 20], street_e: [55, 20], lamp_row: [30, 18], festival: [36, 20] },
    onEnter: first('yukemuri_village'),
  });
}
// ------------------------------------------------------------------ interiors
const WOOD = { '#': 'int_wall_wood', '.': 'int_fl_planks', t: 'int_fl_tatami', s: 'int_fl_stone', d: 'int_fl_door', b: 'int_fl_bath', k: 'int_fl_kitchen' };
const R = (rows) => rows.map((r) => r);
interior('ryokan_lobby', {
  name: 'Ryokan Kitsune-no-Yu', legend: WOOD,
  rows: R(['################', '#..............#', '#..............#', '#..............#', '#.........tttt.#', '#.........tttt.#', '#.........tttt.d', '#..............#', '#..............#', '#..ss..........#', '#..ss..........#', '#######dd#######']),
  objects: [
    { spr: 'coast_reception', x: 6, y: 2, w: 3, use: 'yk_desk', shadow: 0 }, { spr: 'coast_tea_cart', x: 3, y: 2, use: 'yk_tea', shadow: 14 },
    { spr: 'int_table', x: 11, y: 4, w: 2, shadow: 20 }, { spr: 'int_cushion', x: 10, y: 5, solid: false }, { spr: 'int_cushion', x: 13, y: 5, solid: false },
    { spr: 'yk_locker', x: 1, y: 9, w: 2, h: 2, shadow: 0 }, { spr: 'int_plant_tall', x: 14, y: 1, shadow: 8 }, { spr: 'int_lamp', x: 1, y: 1, dx: 8, light: { kind: 'lamp', y: -20 } },
    { spr: 'int_rug_long', x: 4, y: 7, w: 3, flat: true, solid: false }, { spr: 'int_lamp', x: 14, y: 8, dx: 8, light: { kind: 'lamp', y: -20 } },
  ],
  warps: [{ x: 7, y: 11, w: 2, to: 'yukemuri_village:from_ryokan_lobby' }, { x: 15, y: 6, to: 'ryokan_room:from_ryokan_lobby', locked: (g) => !(g.state.sv4_land && g.state.sv4_land.stay.paid === g.day && g.minutes >= 15 * 60), lockedText: 'Guest rooms are for booked guests. Ask the okami at the desk (check-in from 3 PM).' }],
  spawns: { default: [7, 9, 'up'], from_yukemuri_village: [7, 10, 'up'], from_ryokan_room: [14, 6, 'left'] },
  spots: { desk: [7, 4], lounge: [12, 6], tea: [4, 4], door: [7, 10], hall: [14, 6], genkan: [3, 9] },
});
interior('ryokan_room', {
  name: 'Ryokan Guest Room', legend: { ...WOOD, '#': 'int_wall_wood' },
  rows: R(['############', '#tttttttbbb#', '#tttttttbbb#', '#tttttttbbb#', '#ttttttttt##', 'dtttttttttt#', '#tttttttttt#', '#tttttttttt#', '#tttttttttt#', '############']),
  objects: [
    { spr: 'int_futon', x: 3, y: 2, w: 2, h: 2, shadow: 0, interact: { label: 'Futon', run: (g) => g.run([{ t: 'call', fn: () => g.sv4Sleep && g.sv4Sleep('ryokan') }]) } },
    { spr: 'int_kotatsu_fixed', x: 6, y: 5, w: 2, use: 'yk_room_tea', shadow: 0 }, { spr: 'int_cushion', x: 5, y: 6, solid: false }, { spr: 'int_cushion', x: 8, y: 6, solid: false },
    { spr: 'coast_window', x: 5, y: 1, w: 2, use: 'yk_window', shadow: 0 }, { spr: 'int_tub_hinoki', x: 8, y: 1, w: 2, use: 'yk_soak_ryokan', shadow: 0 },
    { spr: 'int_lamp', x: 1, y: 1, dx: 8, light: { kind: 'lamp', y: -20 } }, { spr: 'int_plant_tall', x: 1, y: 8, shadow: 8 },
  ],
  warps: [{ x: 0, y: 5, to: 'ryokan_lobby:from_ryokan_room' }],
  spawns: { default: [2, 5, 'right'], from_ryokan_lobby: [2, 5, 'right'] },
  spots: { futon: [3, 4], table: [6, 7], tub: [8, 4], window: [6, 2], door: [1, 5] },
});
{
  const rows = ['######################'];
  for (const y of [1, 2, 3]) rows.push('#bbbbbbbbbb#sssssssss#');
  for (const y of [4, 5]) rows.push('#bbbbbbbbbbbsssssssss#');
  for (const y of [6, 7, 8]) rows.push('#bbbbbbbbbb#sssssssss#');
  rows.push('#####bb###############');
  for (let y = 10; y < 15; y++) rows.push('#....................#');
  rows.push('##########dd##########');
  interior('onsen_bath', {
    name: 'Yukemuri Public Bath', legend: { ...WOOD, '#': 'int_wall_bath' }, music: 'home',
    rows,
    objects: [
      { spr: 'yk_pool_in', x: 2, y: 2, w: 4, h: 3, flat: true, fp: [2, 2, 4, 3], use: 'yk_soak_in', overlay: steam(32, 20, 8) },
      { spr: 'yk_pool_out', x: 14, y: 2, w: 5, h: 3, flat: true, fp: [14, 2, 5, 3], use: 'yk_soak_out', overlay: steam(40, 20, 8) },
      ...[2, 4, 6, 8].map((x) => ({ spr: 'yk_wash', x, y: 7, use: 'yk_wash', shadow: 6 })),
      { spr: 'yk_locker', x: 1, y: 10, w: 2, h: 2, shadow: 0 }, { spr: 'yk_poster', x: 6, y: 10, use: 'yk_poster', shadow: 4 },
      { spr: 'coast_counter', x: 14, y: 11, w: 3, use: 'yk_bath_counter', shadow: 0 }, { spr: 'yk_fruitmilk', x: 19, y: 10, use: 'yk_milk', shadow: 8 },
      { spr: 'coast_bench', x: 9, y: 13, w: 2, use: 'bench', shadow: 12 }, { spr: 'coast_rock_m', x: 19, y: 7, shadow: 12 }, { spr: 'coast_rock_s', x: 12, y: 8, shadow: 8 },
      { spr: 'yk_noren_bath', x: 5, y: 9, w: 2, flat: true, solid: false, dy: -4 },
    ],
    warps: [{ x: 10, y: 15, w: 2, to: 'yukemuri_village:from_onsen_bath' }],
    spawns: { default: [10, 13, 'up'], from_yukemuri_village: [10, 14, 'up'] },
    spots: { counter: [15, 10], wash_1: [2, 8], wash_2: [4, 8], pool_in: [4, 5], pool_out: [16, 5], door: [10, 14], locker: [3, 12], poster: [6, 11], rest: [18, 13], outdoor: [13, 1] },
  });
}
interior('mountain_hut', {
  name: 'Tsukimi Hut', legend: { ...WOOD },
  rows: ['##############', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '######dd######'],
  objects: [
    { spr: 'tk_hearth', x: 5, y: 1, w: 2, h: 2, shadow: 0, use: 'tk_hut_rest', light: { kind: 'lantern', y: -10 } },
    { spr: 'tk_hut_bunk', x: 1, y: 1, w: 2, h: 2, use: 'tk_bunk', shadow: 0 }, { spr: 'tk_hut_bunk', x: 11, y: 1, w: 2, h: 2, use: 'tk_bunk', shadow: 0 },
    { spr: 'tk_barrel_tub', x: 10, y: 6, w: 2, h: 2, use: 'yk_soak_hut', shadow: 0, overlay: steam(24, 14, 5) }, { spr: 'coast_logdesk', x: 2, y: 6, w: 2, use: 'tk_logbook', shadow: 0 },
    { spr: 'int_table', x: 6, y: 5, w: 2, shadow: 20 }, { spr: 'int_stool', x: 5, y: 5, solid: false }, { spr: 'int_stool', x: 8, y: 5, solid: false }, { spr: 'int_shelf_home', x: 8, y: 1, w: 2, shadow: 0 },
  ],
  warps: [{ x: 6, y: 9, w: 2, to: 'tsukimi_forest:from_mountain_hut' }],
  spawns: { default: [6, 8, 'up'], from_tsukimi_forest: [6, 8, 'up'] },
  spots: { stove: [6, 4], bunk: [3, 4], logbook: [3, 7], tub: [9, 7], door: [6, 8], window: [10, 3] },
});
void prop; void tree; void row; void signpost;
