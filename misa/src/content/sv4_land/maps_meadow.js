// Meadow Hills: road hub, ranch, windmill, orchard, lake, market and the lakeside cabin, plus the wrapped warps on lane and town.
import { get } from '../../core/registry.js';
import { townMap, grid, prop } from '../town/lib.js';
import { building } from '../town/facade.js';
import { P, lamp, bench, signpost, row } from '../town/interactions.js';
import { LIGHT } from '../town/props_street.js';
import './art.js';
import { MLEGEND, scatter, interior, steam } from './kit.js';
import { SV4 } from './data.js';

const first = (id) => (g) => { const S = SV4(g); if (S && !S.visited[id]) { S.visited[id] = 1; g.stat('regionPlaces'); } };
export const cabinOpen = (g) => { const S = g.state.sv4_land; return !!S && g.day <= S.cabin; };
export const PASTURES = { cow: [3, 5, 13, 15], sheep: [18, 4, 28, 13], horse: [33, 5, 42, 15] };
const fenceH = (x0, x1, y, gap) => row('town_fence_wood', x0, x1, y).filter((o) => o.x !== gap);
const fenceV = (x, y0, y1) => { const out = []; for (let y = y0; y <= y1; y++) out.push({ spr: 'town_fence_v', x, y }); return out; };
const pen = ([x0, y0, x1, y1], gapX) => [...fenceH(x0 - 1, x1 + 1, y0 - 1), ...fenceH(x0 - 1, x1 + 1, y1 + 1, gapX), ...fenceV(x0 - 1, y0, y1), ...fenceV(x1 + 1, y0, y1)];

// ------------------------------------------------------------------ road hub 48x22
{
  const g = grid(48, 22, '.');
  g.fill(0, 0, 48, 2, 'T').fill(0, 0, 1, 22, 'T').fill(47, 0, 1, 22, 'T').fill(0, 21, 48, 1, 'T');
  g.fill(0, 9, 47, 3, ':').fill(47, 9, 1, 3, ':').fill(9, 0, 3, 10, ':').fill(23, 0, 3, 10, ':').fill(37, 0, 3, 10, ':').fill(5, 11, 3, 11, ':').fill(31, 11, 3, 11, ':');
  g.blob(16, 16, 4, 2, ',').blob(40, 15, 4, 3, ',').blob(14, 4, 3, 2, ',').blob(30, 5, 3, 2, ',');
  const objs = [
    signpost(8, 8, 'North: Meadow Ranch. Cows, sheep and horses.'), signpost(22, 8, 'North: the Windmill. Fresh flour daily.'), signpost(36, 8, 'North: Meadow Lake and the lakeside cabin.'), signpost(30, 13, 'South: the Meadow Market (weekends). West: Lantern Lane.'),
    P('town_busstop_sign', 14, 12, { use: 'sv4_bus', shadow: 6 }), P('town_bus_shelter', 15, 12, { w: 3, use: 'sv4_bus' }), P('ml_board', 26, 8, { use: 'ml_board', shadow: 8 }),
    P('ml_hayroll', 20, 13, { shadow: 12 }), P('ml_hayroll', 28, 6, { shadow: 12 }), P('town_flowerbed', 40, 14, { w: 2 }), P('town_bush_flower', 12, 13), lamp(10, 12), lamp(44, 8),
    ...row('town_fence_wood', 1, 4, 13), ...row('town_fence_wood', 34, 38, 13),
  ];
  objs.push(...scatter(g.rows(), objs, { seed: 41, dens: 0.1 }));
  townMap('meadow_road', {
    name: 'Meadow Road', music: 'town', bg: '#1a2a20', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 9, y: 0, w: 3, to: 'meadow_ranch:from_meadow_road' }, { x: 23, y: 0, w: 3, to: 'meadow_windmill:from_meadow_road' }, { x: 37, y: 0, w: 3, to: 'meadow_lake:from_meadow_road' },
      { x: 5, y: 21, w: 3, to: 'lane:from_meadow_road' }, { x: 31, y: 21, w: 3, to: 'meadow_market:from_meadow_road' }, { x: 47, y: 9, h: 3, to: 'meadow_orchard:from_meadow_road' }],
    spawns: { default: [24, 10, 'down'], from_lane: [6, 19, 'up'], from_meadow_ranch: [10, 2, 'down'], from_meadow_windmill: [24, 2, 'down'], from_meadow_lake: [38, 2, 'down'], from_meadow_market: [32, 19, 'up'], from_meadow_orchard: [45, 10, 'left'] },
    spots: { lane_gate: [6, 19], ranch_gate: [10, 8], windmill_gate: [24, 8], lake_gate: [38, 8], market_gate: [32, 13], orchard_gate: [45, 10], bus_stop: [14, 13], signpost: [21, 10], crossroad: [24, 10] },
    onEnter: first('meadow_road'),
  });
}
// ------------------------------------------------------------------ ranch 46x30
{
  const g = grid(46, 30, '.');
  g.fill(0, 0, 46, 2, 'T').fill(0, 0, 1, 30, 'T').fill(45, 0, 1, 30, 'T').fill(0, 29, 46, 1, 'T');
  g.fill(10, 19, 24, 9, ':').fill(8, 16, 1, 4, ':').fill(22, 14, 1, 6, ':').fill(37, 16, 1, 4, ':').fill(20, 22, 3, 8, '=');
  g.blob(8, 10, 4, 3, ',').blob(23, 8, 4, 3, ',').blob(38, 10, 4, 3, ',');
  const objs = [
    ...pen(PASTURES.cow, 8), ...pen(PASTURES.sheep, 22), ...pen(PASTURES.horse, 37),
    P('sv_barn', 14, 18, { w: 4, h: 3, use: 'ml_barn', shadow: 0 }), P('ml_ranch_store', 24, 18, { w: 4, h: 3, use: 'sv4_shop_ranch', shadow: 0 }), P('ml_silo', 10, 17, { w: 2, h: 3, shadow: 0 }),
    P('ml_trough', 5, 6, { w: 2, shadow: 0 }), P('ml_trough', 21, 5, { w: 2, shadow: 0 }), P('ml_trough', 36, 6, { w: 2, shadow: 0 }),
    P('ml_hayroll', 30, 20, { shadow: 12 }), P('ml_hayroll', 12, 25, { shadow: 12 }), P('sv_haystack', 32, 24, { shadow: 14 }), P('sv_board', 19, 24, { use: 'sv_ranch', shadow: 8 }),
    bench(27, 23), lamp(18, 22), lamp(24, 22), P('town_signpost', 7, 17, { shadow: 6 }),
  ];
  objs.push(...scatter(g.rows(), objs, { seed: 52, dens: 0.14 }));
  townMap('meadow_ranch', {
    name: 'Meadow Ranch', music: 'town', bg: '#1a2a20', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 20, y: 29, w: 3, to: 'meadow_road:from_meadow_ranch' }],
    spawns: { default: [21, 26, 'up'], from_meadow_road: [21, 27, 'up'] },
    spots: { cow_pasture: [8, 10], sheep_pasture: [22, 9], horse_paddock: [37, 10], barn: [16, 22], store: [26, 22], yard: [21, 24], gate_cow: [8, 17], gate_sheep: [22, 15], gate_horse: [37, 17], entrance: [21, 27], silo: [12, 22], bench: [27, 24] },
    onEnter: first('meadow_ranch'),
  });
}
// ------------------------------------------------------------------ windmill 30x22
export const WHEAT = { x0: 3, y0: 8, x1: 8, y1: 11 };
{
  const g = grid(30, 22, '.');
  g.fill(0, 0, 30, 1, 'T').fill(0, 0, 1, 22, 'T').fill(29, 0, 1, 22, 'T').fill(0, 21, 30, 1, 'T');
  g.fill(10, 7, 11, 8, ':').fill(13, 15, 3, 6, ':');
  const objs = [
    { spr: 'ml_windmill_0', sprFn: (gm) => `ml_windmill_${Math.floor(gm.clock * 1.5) % 4}`, x: 12, y: 1, w: 4, h: 6, fp: [12, 5, 4, 2], use: 'ml_mill', shadow: 0 },
    P('ml_stall_bread', 17, 7, { w: 2, use: 'sv4_shop_mill', shadow: 0 }), P('sv2_crate', 11, 7, { shadow: 12 }), P('sv2_crate', 19, 11, { shadow: 12 }), bench(20, 14), lamp(13, 14), lamp(17, 14),
    P('ml_hayroll', 24, 10, { shadow: 12 }), P('town_fence_wood', 9, 7, { solid: true }),
  ];
  for (let y = WHEAT.y0; y <= WHEAT.y1; y++) for (let x = WHEAT.x0; x <= WHEAT.x1; x++) objs.push({ spr: 'ml_wheat', x, y, flat: true, solid: false });
  objs.push(...scatter(g.rows(), objs, { seed: 63, dens: 0.12 }));
  townMap('meadow_windmill', {
    name: 'Windmill', music: 'town', bg: '#1a2a20', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 13, y: 21, w: 3, to: 'meadow_road:from_meadow_windmill' }],
    spawns: { default: [14, 18, 'up'], from_meadow_road: [14, 19, 'up'] },
    spots: { mill_door: [14, 8], field: [5, 12], shop: [18, 9], yard: [14, 12], bench: [20, 15], entrance: [14, 19] },
    onEnter: first('meadow_windmill'),
  });
}
// ------------------------------------------------------------------ orchard 40x26
export const ORCHARD_ROWS = [['cherry', 4, 'spring', 'ing_cherry'], ['peach', 8, 'summer', 'ing_peach'], ['apple', 15, 'autumn', 'ing_apple'], ['orange', 19, 'winter', 'ing_ml_mikan']];
export const orchardTrees = () => {
  const out = [];
  for (const [kind, y] of ORCHARD_ROWS) for (let i = 0; i < 8; i++) out.push({ kind: kind === 'apple' && i % 2 ? 'persimmon' : kind, x: 7 + 3 * i, y });
  return out;
};
{
  const g = grid(40, 26, '.');
  g.fill(0, 0, 40, 2, 'T').fill(39, 0, 1, 26, 'T').fill(0, 24, 40, 2, 'T').fill(0, 0, 1, 26, 'T');
  g.fill(0, 12, 39, 2, ':').fill(33, 2, 3, 22, ':').fill(0, 11, 1, 4, ':');
  const objs = [
    P('ml_fruit_stand', 3, 9, { w: 2, use: 'sv4_shop_fruit', shadow: 0 }), P('ml_board', 5, 10, { use: 'ml_orchard_gate', shadow: 8 }),
    { spr: 'ev_picnic_mat', x: 30, y: 9, w: 2, flat: true, solid: false }, { spr: 'ev_picnic_mat', x: 28, y: 15, w: 2, flat: true, solid: false },
    P('sv_m_bee_idle', 37, 3), P('sv_m_bee_idle', 37, 5), bench(36, 14), lamp(2, 14),
  ];
  for (const t of orchardTrees()) objs.push(prop(`sv2_t_full_${t.kind}`, t.x, t.y, { shadow: 14 }));
  for (const [kind, y] of ORCHARD_ROWS) objs.push(P('town_signpost', 5, y, { use: 'ml_row_sign', shadow: 6, rowKind: kind }));
  objs.push(...scatter(g.rows(), objs, { seed: 74, dens: 0.05 }));
  townMap('meadow_orchard', {
    name: 'Meadow Orchard', music: 'town', bg: '#1a2a20', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 0, y: 11, h: 4, to: 'meadow_road:from_meadow_orchard' }],
    spawns: { default: [2, 12, 'right'], from_meadow_road: [2, 12, 'right'] },
    spots: { gate: [2, 12], stand: [3, 12], picnic: [31, 12], aisle: [34, 12], bench: [36, 15], cherry_row: [9, 6], peach_row: [9, 10], apple_row: [9, 17], mikan_row: [9, 21] },
    onEnter: first('meadow_orchard'),
  });
}
// ------------------------------------------------------------------ lake 40x28
{
  const g = grid(40, 28, '.');
  g.fill(0, 0, 40, 2, 'T').fill(0, 0, 1, 28, 'T').fill(39, 0, 1, 28, 'T');
  g.blob(20, 14, 13, 9, 's').blob(20, 14, 11, 7, '~').fill(9, 19, 3, 2, 's').fill(12, 19, 6, 2, 'D').fill(33, 8, 3, 17, ':').fill(17, 24, 19, 3, ':').fill(17, 27, 3, 1, ':');
  const boat = building('ml_boathouse', 3, 19, {});
  boat.obj.use = 'ml_boathouse';
  const cabin = building('ml_cabin', 32, 3, { to: 'meadow_cabin:from_meadow_lake', spawn: 'from_meadow_cabin', locked: (g2) => !cabinOpen(g2), lockedText: 'The cabin is locked. Rent it at the board for a weekend getaway.' });
  const objs = [
    boat.obj, cabin.obj, P('ml_board', 31, 9, { use: 'ml_cabin_desk', shadow: 8 }), { x: 17, y: 19, w: 1, h: 1, solid: false, use: 'ml_row' },
    { spr: 'coast_rowboat_a', x: 14, y: 21, w: 2, solid: false, shadow: 0 }, P('ml_reeds', 8, 12, { solid: false }), P('ml_reeds', 29, 8, { solid: false }), P('ml_reeds', 9, 17, { solid: false }),
    { spr: 'ml_lily', x: 22, y: 12, solid: false, flat: true }, { spr: 'ml_lily', x: 17, y: 15, solid: false, flat: true }, { spr: 'ml_lily', x: 25, y: 16, solid: false, flat: true },
    bench(21, 25), lamp(16, 25), lamp(30, 24), P('coast_buoy', 24, 11, { solid: false }),
  ];
  for (let x = 12; x <= 17; x++) for (const y of [19, 20]) objs.push({ spr: 'ml_dock', x, y, flat: true, solid: false });
  objs.push(...scatter(g.rows(), objs, { seed: 85, dens: 0.15 }));
  townMap('meadow_lake', {
    name: 'Meadow Lake', music: 'town', bg: '#10202a', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 17, y: 27, w: 3, to: 'meadow_road:from_meadow_lake' }, ...cabin.warps],
    spawns: { default: [18, 25, 'up'], from_meadow_road: [18, 25, 'up'], from_meadow_cabin: [34, 9, 'down'] },
    spots: { boathouse_door: [4, 23], dock: [13, 19], shore: [10, 22], cabin_path: [34, 10], cabin_door: [34, 9], bench: [21, 26], entrance: [18, 26], reeds: [8, 13] },
    onEnter: first('meadow_lake'),
  });
}
// ------------------------------------------------------------------ market 36x24
{
  const g = grid(36, 24, '.');
  g.fill(0, 0, 36, 2, 'T').fill(0, 0, 1, 24, 'T').fill(35, 0, 1, 24, 'T').fill(8, 6, 21, 11, '+').fill(16, 17, 3, 7, '=');
  const open = { any: ['weekend', 'flag:festival_today'] };
  const stalls = [['ml_stall_milk', 9, 'sv4_shop_dairy'], ['ml_stall_bread', 12, 'sv4_shop_bakery'], ['ml_stall_craft', 15, 'sv4_shop_craft'], ['town_stall_veg', 18, 'sv4_shop_produce'], ['town_stall_fruit', 21, 'sv4_shop_produce'], ['town_stall_flower', 24, 'sv4_shop_craft']];
  const objs = [
    P('sv_barn', 16, 2, { w: 4, h: 3, shadow: 0 }), { spr: 'ml_dance_floor', x: 12, y: 10, w: 5, h: 3, flat: true, solid: false, when: 'flag:festival_ml_barn_dance' },
    P('ml_hayroll', 11, 10, { when: 'flag:festival_ml_barn_dance', shadow: 12 }), P('ml_hayroll', 18, 12, { when: 'flag:festival_ml_barn_dance', shadow: 12 }),
    P('town_stage', 22, 17, { w: 5, h: 2, shadow: 0 }), P('town_chalkboard', 30, 12, { use: 'ml_market_board', shadow: 6 }), bench(6, 12), lamp(8, 17), lamp(28, 17),
    { spr: 'town_bunting', x: 10, y: 5, w: 6, solid: false, flat: false, when: 'flag:festival_today', dy: -26 },
  ];
  for (const [spr, x, use] of stalls) { objs.push(P(spr, x, 6, { w: 2, use, when: open, shadow: 22 })); objs.push(P('town_crates', x, 6, { when: { not: open }, shadow: 10 })); }
  objs.push(...scatter(g.rows(), objs, { seed: 96, dens: 0.15 }));
  townMap('meadow_market', {
    name: 'Meadow Market', music: 'town', bg: '#1a2a20', legend: MLEGEND, rows: g.rows(), objects: objs,
    warps: [{ x: 16, y: 23, w: 3, to: 'meadow_road:from_meadow_market' }],
    spawns: { default: [17, 20, 'up'], from_meadow_road: [17, 21, 'up'] },
    spots: { stall_dairy: [10, 8], stall_bread: [13, 8], stall_craft: [16, 8], stall_veg: [19, 8], stall_fruit: [22, 8], stall_flower: [25, 8], dance_floor: [14, 14], stage: [24, 16], bench: [6, 13], entrance: [17, 21], vet: [29, 13], square: [18, 12] },
    onEnter: first('meadow_market'),
  });
}
// ------------------------------------------------------------------ cabin 16x12
interior('meadow_cabin', {
  name: 'Lakeside Cabin', legend: { '#': 'int_wall_wood', '.': 'int_fl_planks', k: 'int_fl_kitchen', d: 'int_fl_door' },
  rows: ['################', '#kkkk..........#', '#kkkk..........#', ...Array(8).fill('#..............#'), '#######dd#######'].slice(0, 12),
  objects: [
    { spr: 'int_stove', x: 1, y: 1, use: 'stove', shadow: 0 }, { spr: 'int_counter_long', x: 2, y: 1, w: 3, shadow: 0 }, { spr: 'tk_hearth', x: 6, y: 1, w: 2, h: 2, use: 'ml_cabin_fire', shadow: 0, light: { kind: 'lantern', y: -10 } },
    { spr: 'int_bookshelf', x: 9, y: 1, use: 'bookshelf', shadow: 14 }, { spr: 'int_bed', x: 13, y: 2, w: 2, h: 2, fp: [13, 2, 1.25, 2], interact: { label: 'Sleep in the cabin', run: (g) => g.sv4Sleep && g.sv4Sleep('cabin') } },
    { spr: 'int_sofa_back', x: 4, y: 5, w: 3, dx: -6, use: 'sofa', shadow: 30 }, { spr: 'int_rug_long', x: 4, y: 6, w: 3, flat: true, solid: false }, { spr: 'int_table', x: 9, y: 6, w: 2, shadow: 20 },
    { spr: 'ml_hottub', x: 11, y: 9, w: 2, use: 'yk_soak_cabin', shadow: 0, overlay: steam(30, 14, 5) }, { spr: 'int_lamp', x: 12, y: 1, dx: 8, light: { kind: 'lamp', y: -20 } }, { spr: 'int_plant_tall', x: 1, y: 9, shadow: 8 },
  ],
  warps: [{ x: 7, y: 11, w: 2, to: 'meadow_lake:from_meadow_cabin' }],
  spawns: { default: [7, 10, 'up'], from_meadow_lake: [7, 10, 'up'] },
  spots: { bed: [12, 3], hearth: [7, 3], hot_tub: [10, 9], door: [7, 10], sofa: [5, 7], table: [9, 8] },
  onEnter: first('meadow_cabin'),
});

// ------------------------------------------------------------------ wrapped warps on the lane and town (no edits to town files)
const wrap = (def, key, extra) => { const d = Object.getOwnPropertyDescriptor(def, key); const base = d && d.get ? () => d.get.call(def) : () => def[key] || []; Object.defineProperty(def, key, { enumerable: true, configurable: true, get: () => [...base(), ...extra] }); };
{
  const lane = get('map', 'lane'), town = get('map', 'town');
  if (lane) { wrap(lane, 'warps', [{ x: 39, y: 0, w: 2, to: 'meadow_road:from_lane' }]); wrap(lane, 'objects', [signpost(38, 1, 'North-east: Meadow Hills. Ranch, windmill, orchard and lake.')]); lane.spawns.from_meadow_road = [40, 1, 'down']; }
  if (town) { wrap(town, 'warps', [{ x: 45, y: 0, to: 'tsukimi_trailhead:from_town' }]); wrap(town, 'objects', [signpost(44, 1, 'North-east trail: Mount Tsukimi and the Yukemuri hot springs. Buses run from the stop on the east side.')]); town.spawns.from_tsukimi_trailhead = [45, 1, 'down']; }
}
void lamp; void bench;
