// Coast & hill maps: harbour, beach, cave, shrine, lighthouse, sunny_pines (see docs/WORLD.md for the contract).
import { registerMany, features } from '../../core/registry.js';
import { prop } from '../town/lib.js';
import { grid, coastMap, hash } from './util.js';
import { TIDAL, FLOATERS, CAVE_GLOWS, BEAM } from './layers.js';

registerMany('tile', {
  coast_block: { ground: 'paved', solid: true },        // behind harbour buildings
  coast_wood: { ground: 'grass', solid: true },          // wooded slopes (trees on top)
  coast_pierwater: { ground: 'ocean' },                  // walkable water under pier planks
  coast_shallows: { ground: 'ocean' },                   // sand that only shows at low tide (tide layer blocks it)
  coast_cliff: { ground: 'dirt', solid: true },          // cliff faces (sprites baked on top)
  coast_seawall: { ground: 'paved', solid: true },
  coast_cavewall: { ground: 'dirt', solid: true },
  coast_apron: { ground: 'dirt' },
  coast_rail: { ground: 'grass', solid: true },
  coast_lh_wall: { wall: 'plaster', tint: 'paper', solid: true },
  coast_grate: { floor: 'stone' },
  coast_railtile: { floor: 'stone', solid: true },
  coast_void: { spr: null, solid: true },
});

const lit = (k = 'lamp', y) => ({ light: { kind: k, ...(y !== undefined ? { y } : {}) } });
const nightLit = { light: { kind: 'lamp' } };
// Cliff faces: rim / face / base sprites chosen by the run of cliff tiles above and below.
function cliffObjects(G, ch = 'C') {
  const out = [];
  G.each((x, y, c) => {
    if (c !== ch) return;
    const up = G.get(x, y - 1) === ch, down = G.get(x, y + 1) === ch, v = Math.floor(hash(x, y, 5) * 3);
    out.push({ spr: `coast_cliff_${!up ? 'rim' : !down ? 'base' : 'face'}_${v}`, x, y, wall: true, solid: false });
  });
  return out;
}

// =============================== HARBOUR (48x22) ===============================
{
  const G = grid(48, 22, '~');
  G.rect(0, 0, 48, 10, '=').rect(0, 0, 48, 3, 'B').rect(2, 0, 3, 3, '=').rect(0, 0, 2, 10, 'T');
  G.rect(24, 0, 24, 3, 'T');
  G.rect(0, 10, 48, 1, 'W').rect(44, 3, 4, 8, 's').rect(43, 9, 5, 2, 's');
  G.rect(8, 10, 3, 10, 'p').rect(26, 11, 12, 2, 'p').rect(30, 10, 3, 1, 'p');
  const pier = [];
  G.each((x, y, c) => {
    if (c !== 'p') return;
    const l = G.get(x - 1, y) !== 'p', r = G.get(x + 1, y) !== 'p', b = G.get(x, y + 1) !== 'p';
    pier.push({ spr: `coast_pier_${b ? 'b' : ''}${l ? 'l' : r ? 'r' : 'm'}`, x, y, wall: true, solid: false });
    if (b) pier.push({ spr: 'coast_piles', x, y: y + 1, wall: true, solid: false, dy: -10 });
  });
  const wall = []; G.each((x, y, c) => { if (c === 'W') wall.push({ spr: `coast_seawall_${x % 2}`, x, y, wall: true, solid: false }); });
  FLOATERS.harbour = [
    { spr: 'coast_sayori', x: 28 * 16 - 2, y: 13 * 16 - 8, amp: 1.5, ph: 0, base: 40 },
    { spr: 'coast_rowboat_a', x: 4 * 16, y: 13 * 16, amp: 1, ph: 1, base: 14 },
    { spr: 'coast_rowboat_b', x: 12 * 16, y: 16 * 16, amp: 1, ph: 2.4, base: 14 },
    { spr: 'coast_buoy', x: 18 * 16, y: 17 * 16, amp: 1.5, ph: 0.7, base: 9 },
    { spr: 'coast_buoy', x: 41 * 16, y: 15 * 16, amp: 1.5, ph: 3, base: 9 },
    { spr: 'coast_buoy', x: 23 * 16, y: 19 * 16, amp: 1.5, ph: 1.9, base: 9 },
  ];
  coastMap('harbour', {
    name: 'Harbour & Fish Market', outdoor: true, music: 'beach',
    legend: { '=': 'paved', 'B': 'coast_block', 'T': 'coast_wood', '~': 'ocean', 'p': 'coast_pierwater', 'W': 'coast_seawall', 's': 'sand' },
    rows: G.rows(),
    objects: [
      ...wall, ...pier,
      prop('coast_bait_shop', 5, 1, { w: 6, h: 2, use: 'shop_bait', soon: 'Bait & Tackle: rods, lures and Captain Jun\'s tall tales. Opening soon!', soonLabel: 'Bait & Tackle' }),
      prop('coast_mural', 12, 1, { w: 6, h: 2, use: 'coast_mural' }),
      prop('coast_coop', 18, 1, { w: 6, h: 2, use: 'job_fishmarket', soon: 'The fisheries co-op. "Help wanted: early mornings."', soonLabel: 'Fish co-op' }),
      prop('town_tree_pine', 26, 2), prop('town_tree_pine_b', 31, 2), prop('town_bush', 28, 2), prop('town_tree_pine', 35, 2), prop('town_bush_flower', 38, 2), prop('town_tree_oak_s', 41, 2), prop('town_tree_pine_s', 45, 2), prop('town_tree_pine_s', 0, 4), prop('town_bush', 0, 8),
      prop('coast_stall_a', 22, 5, { w: 3, use: 'shop_fishmarket', soon: 'Today\'s catch on ice: mackerel, bream and squid. The market opens soon!', soonLabel: 'Fish market', shadow: 30 }),
      prop('coast_stall_b', 26, 5, { w: 3, use: 'shop_fishmarket', soon: 'Today\'s catch on ice. The market opens soon!', soonLabel: 'Fish market', shadow: 30 }),
      prop('coast_yatai', 36, 4, { w: 3, use: 'shop_noodles', soon: 'The noodle stand. A sign: "Back at 19:00".', soonLabel: 'Noodle stand', sprFn: (g) => (g.minutes >= 17.5 * 60 || g.minutes < 5 * 60 ? 'coast_yatai_lit' : 'coast_yatai'), light: { kind: 'lantern', x: 4, y: -20 }, shadow: 30 }),
      prop('coast_stool', 35, 5, { solid: false }), prop('coast_stool', 39, 5, { solid: false }),
      prop('coast_tide_board', 13, 4, { use: 'coast_tideboard', shadow: 12 }),
      prop('town_busstop_sign', 5, 4, { use: 'bus_stop', shadow: 6 }),
      prop('coast_bench', 16, 7, { w: 2, use: 'bench', shadow: 18 }), prop('coast_bench', 41, 6, { w: 2, use: 'bench', shadow: 18 }),
      ...[4, 20, 33, 44].map((x) => prop('coast_lamp', x, 8, { ...nightLit, shadow: 6 })),
      ...[12, 18, 24, 38].map((x, i) => prop(i % 2 ? 'coast_bollard_rope' : 'coast_bollard', x, 9, { shadow: 6 })),
      prop('coast_crates', 24, 3, { use: 'coast_seastuff' }), prop('coast_crate', 25, 4, { use: 'coast_seastuff' }), prop('coast_fishbox', 21, 4, { solid: false }),
      prop('coast_net', 34, 9, { w: 2, use: 'coast_seastuff' }), prop('coast_rope', 27, 9, { solid: false }),
      prop('coast_lifering', 11, 9, { use: 'coast_lifering' }),
      prop('coast_binocular', 10, 18, { use: 'coast_binoculars', shadow: 6 }),
      { x: 28, y: 13, w: 4, h: 1, use: 'coast_boat' },
    ],
    warps: [{ x: 2, y: 0, w: 3, to: 'town:from_harbour' }, { x: 47, y: 3, h: 8, to: 'beach:from_harbour' }],
    spawns: { default: [20, 6], from_town: [3, 2, 'down'], from_beach: [46, 6, 'left'] },
    spots: { pier_end: [9, 18], bait_shop: [8, 3], market_stall: [23, 6], dock: [34, 11], mural: [14, 3], noodle_stand: [37, 6], boat: [30, 12], bus_stop: [6, 5], bench: [17, 8] },
  });
}

// =============================== BEACH (52x24) ===============================
{
  const G = grid(52, 24, '~');
  G.rect(0, 0, 52, 2, 'T').rect(0, 2, 41, 2, ',');
  for (let x = 0; x < 42; x++) { const b = 13 + Math.round(Math.sin(x / 4.5) * 1.2 + Math.sin(x / 11) * 0.8); G.rect(x, 4, 1, b - 3, '.'); }
  G.rect(41, 2, 1, 8, 'T').rect(42, 2, 10, 9, 'h').rect(42, 8, 3, 2, 'C').set(43, 8, '/').set(43, 9, '/').rect(42, 10, 3, 4, '.');
  G.rect(45, 11, 7, 2, 'C').rect(45, 9, 1, 2, 'T').set(47, 12, 'a').set(48, 12, 'a').rect(45, 13, 6, 2, 's');
  G.rect(18, 14, 5, 5, 's').blob(20, 20, 3, 1, 's');
  const sandbar = [], apron = [];
  G.each((x, y, c) => { if (c === 's') (x >= 44 ? apron : sandbar).push([x, y]); });
  TIDAL.beach = [sandbar, apron];
  BEAM.beach = { x: 47 * 16 + 8, y: 5 * 16 - 66 };
  const flats = [...sandbar, ...apron].map(([x, y]) => ({ spr: 'coast_sandbar', x, y, flat: true, solid: false, when: 'tide:low' }));
  const summer = 'season:summer';
  coastMap('beach', {
    name: 'Shell Beach', outdoor: true, music: 'beach',
    legend: { '~': 'ocean', '.': 'sand', ',': 'grass', 'T': 'coast_wood', 'h': 'grass', 'C': 'coast_cliff', '/': 'coast_apron', 'a': 'coast_apron', 's': 'coast_shallows' },
    rows: G.rows(),
    objects: [
      ...cliffObjects(G), ...flats,
      { spr: 'coast_stairs', x: 43, y: 8, w: 1, h: 2, flat: true, solid: false },
      { spr: 'coast_cave_mouth', x: 47, y: 11, w: 2, h: 2, flat: true, solid: false, sprFn: (g) => (g.check('tide:low') ? 'coast_cave_mouth' : 'coast_cave_mouth_wet') },
      prop('coast_lighthouse', 46, 5, { w: 3, h: 2, sprFn: (g) => (g.flag('lantern_lit') ? 'coast_lighthouse_lit' : 'coast_lighthouse'), light: { kind: 'lamp', when: 'flag:lantern_lit', y: -150 }, shadow: 36 }),
      ...[0, 2, 4, 6].map((i) => prop('coast_rope_fence', 45 + i, 10, { solid: false })),
      prop('town_tree_pine_s', 43, 3), prop('town_tree_pine_s', 41, 4), prop('town_tree_pine_b', 41, 7), prop('town_tree_pine', 50, 3), prop('town_bush', 50, 8), prop('town_tree_pine', 3, 0), prop('town_tree_pine_b', 12, 1), prop('town_tree_pine', 22, 0), prop('town_tree_oak', 31, 1), prop('town_tree_pine_b', 38, 1), prop('town_bush', 41, 9),
      ...[[2, 3], [9, 3], [15, 2], [26, 3], [33, 2], [37, 4], [19, 4]].map(([x, y]) => prop('coast_dunegrass', x, y, { solid: false })),
      prop('town_busstop_sign', 7, 2, { use: 'bus_stop', shadow: 6 }),
      prop('coast_ice_stand', 3, 4, { w: 3, when: summer, use: 'shop_shavedice', soon: 'Shaved ice: strawberry, melon and blue sea. Opening soon!', soonLabel: 'Shaved ice stand', shadow: 30 }),
      prop('coast_umbrella_shade', 8, 8, { w: 2, flat: true, solid: false, when: summer, dx: 6 }),
      prop('coast_umbrella_a', 8, 8, { when: summer, fp: [8.3, 8.5, 0.4, 0.5] }), prop('coast_towel_a', 10, 8, { flat: true, solid: false, when: summer }),
      prop('coast_umbrella_shade', 28, 7, { w: 2, flat: true, solid: false, when: summer, dx: 6 }),
      prop('coast_umbrella_b', 28, 7, { when: summer, fp: [28.3, 7.5, 0.4, 0.5] }), prop('coast_towel_b', 30, 7, { flat: true, solid: false, when: summer }),
      prop('coast_towel_b', 10, 8, { flat: true, solid: false, when: { not: summer } }),
      { spr: 'coast_bonfire_off', x: 14, y: 8, use: 'coast_bonfire', light: { kind: 'lantern', when: 'time>=18:00&time<23:30', y: 4 }, shadow: 14 },
      prop('coast_driftwood', 24, 11, { w: 2, shadow: 24 }), prop('coast_driftwood_s', 6, 12, { solid: false }), prop('coast_driftwood_s', 38, 11, { solid: false }),
      prop('coast_rock_l', 33, 12, { w: 2, shadow: 26 }), prop('coast_rock_m', 36, 11, { shadow: 16 }), prop('coast_rock_s', 31, 10, { solid: false }),
      prop('coast_rock_m', 21, 20), prop('coast_rock_s', 18, 20, { solid: false }),
      { spr: 'coast_tidepool', x: 30, y: 12, w: 2, flat: true, use: 'coast_tidepool' },
      { spr: 'coast_tidepool', x: 45, y: 13, w: 2, flat: true, use: 'coast_tidepool', when: 'tide:low' },
      { spr: 'coast_tidepool', x: 19, y: 18, w: 2, flat: true, use: 'coast_tidepool', when: 'tide:low' },
      { x: 11, y: 11, w: 1, h: 1, solid: false, use: 'coast_castle' },
    ],
    warps: [
      { x: 0, y: 4, h: 7, to: 'harbour:from_beach' },
      { x: 47, y: 7, enter: 'up', to: 'lighthouse:from_beach', locked: { not: { any: ['flag:lighthouse_open', 'flag:lantern_lit', 'chapter>=8'] } }, lockedText: 'The keeper\'s door is locked tight. The old lock is rusty but strong.' },
      { x: 47, y: 12, w: 2, enter: 'up', to: 'cave:from_beach', locked: { not: 'tide:low' }, lockedText: 'Waves fill the cave mouth. Wait for low tide.' },
    ],
    spawns: { default: [12, 9], from_harbour: [1, 7, 'right'], from_lighthouse: [47, 8, 'down'], from_cave: [47, 13, 'down'] },
    spots: { shore: [12, 13], towel: [11, 9], bonfire: [14, 10], sandbar: [20, 19], rocks: [33, 11], shaved_ice: [5, 6], driftwood: [24, 10], bus_stop: [8, 3], lighthouse_door: [47, 8] },
  });
}

// =============================== CAVE (24x16) ===============================
{
  const G = grid(24, 16, '#');
  G.blob(12, 8, 9, 4, '.').blob(6, 6, 3, 2, '.').blob(18, 4, 3, 1, '.').rect(16, 3, 4, 3, '.').rect(10, 11, 4, 5, '.').blob(15, 10, 2, 1, ':').blob(8, 10, 2, 1, ':');
  G.rect(5, 8, 2, 1, '~').rect(16, 8, 2, 1, '~');
  const walls = []; G.each((x, y, c) => { if (c !== '#') return; const below = G.get(x, y + 1), v = Math.floor(hash(x, y, 3) * 3); walls.push({ spr: below && below !== '#' ? `coast_cave_face_${v}` : `coast_cave_top_${v}`, x, y, wall: true, solid: false }); });
  CAVE_GLOWS.length = 0;
  CAVE_GLOWS.push({ x: 11.5, y: 15, r: 70, col: 'rgba(90,80,60,0.6)' }, { x: 6, y: 8, r: 34, col: 'rgba(40,110,90,0.5)' }, { x: 16.5, y: 8, r: 26, col: 'rgba(40,110,90,0.5)' }, { x: 4, y: 5, r: 26, col: 'rgba(110,70,140,0.5)' }, { x: 20, y: 6, r: 24, col: 'rgba(110,70,140,0.5)' }, { x: 18, y: 2.5, r: 30, col: 'rgba(110,90,60,0.4)' });
  coastMap('cave', {
    name: 'Tidepool Cave', indoor: true, dark: true, music: 'night', bg: '#141220',
    legend: { '#': 'coast_cavewall', '.': 'dirt', ':': 'sand', '~': 'ocean' },
    rows: G.rows(),
    objects: [
      ...walls,
      { spr: 'coast_cavepool', x: 5, y: 8, w: 2, flat: true, use: 'coast_tidepool' },
      { spr: 'coast_cavepool', x: 16, y: 8, w: 2, flat: true, use: 'coast_tidepool' },
      { spr: 'coast_star_mark', x: 17, y: 2, w: 2, h: 1, wall: true, use: 'coast_starmark', dy: -8 },
      prop('coast_crystal', 4, 5, { use: 'coast_crystal' }), prop('coast_crystal', 20, 6, { use: 'coast_crystal' }),
      prop('coast_stalagmite', 9, 5), prop('coast_stalagmite', 14, 6, { solid: false }), prop('coast_stalagmite', 19, 9),
      prop('coast_rock_m', 13, 10, { solid: false }), prop('coast_rock_s', 10, 8, { solid: false }),
      { x: 12, y: 4, w: 1, h: 1, solid: false, use: 'coast_echo' },
    ],
    warps: [{ x: 10, y: 15, w: 4, enter: 'down', to: 'beach:from_cave' }, { x: 3, y: 6, to: 'hoshi_mine:from_cave', when: (g) => { if (g.state.sv_explore) g.state.sv_explore.mine.floor = 0; return true; } }], // door to Hoshi Mine (sv_explore)
    spawns: { default: [11, 13, 'up'], from_beach: [11, 13, 'up'], from_mine: [4, 6, 'right'] },
    spots: { pools: [7, 9], star_mark: [18, 3], entrance: [12, 13] },
  });
}

// =============================== SHRINE (28x40) ===============================
{
  const G = grid(28, 40, 'T');
  G.blob(14, 17, 10, 9, 'g').rect(5, 10, 18, 16, 'g').rect(10, 26, 8, 3, '=').rect(12, 29, 4, 11, '=');
  G.rect(1, 16, 5, 1, ':').rect(2, 4, 2, 13, ':').rect(1, 1, 8, 4, ',').rect(1, 0, 8, 1, 'R').rect(9, 2, 1, 2, ',');
  G.rect(22, 17, 4, 1, ':').rect(24, 12, 2, 6, ':').blob(24, 10, 2, 1, ',');
  const steps = []; for (let y = 29; y < 39; y++) for (let x = 12; x < 16; x++) steps.push({ spr: 'coast_steps', x, y, wall: true, solid: false });
  const lanternLit = { any: ['time>=17:30', 'time<05:30'] };
  const lantern = (x, y) => prop('coast_lantern', x, y, { sprFn: (g) => (g.check(lanternLit) ? 'coast_lantern_lit' : 'coast_lantern'), light: { kind: 'shrine', when: lanternLit, y: -14 }, shadow: 9 });
  const trees = [[4, 9, 'sakura'], [22, 11, 'sakura'], [5, 24, 'maple'], [21, 23, 'maple'], [9, 27, 'sakura_s'], [18, 27, 'maple_s'], [0, 20, 'pine'], [25, 22, 'pine'], [10, 33, 'pine_s'], [17, 35, 'pine_s'], [6, 7, 'pine_b'], [11, 1, 'pine'], [17, 3, 'pine_b'], [24, 4, 'pine'], [0, 30, 'pine_b'], [24, 31, 'pine'], [5, 36, 'pine'], [21, 38, 'pine_b'], [5, 14, 'maple_s'], [23, 15, 'sakura_s']];
  coastMap('shrine', {
    name: 'Hoshi Hill Shrine', outdoor: true, music: 'shrine',
    legend: { 'T': 'coast_wood', 'g': 'gravel', '=': 'paved', ':': 'dirt', ',': 'grass', 'R': 'coast_rail' },
    rows: G.rows(),
    objects: [
      ...steps,
      ...trees.map(([x, y, k]) => prop(`town_tree_${k}`, x, y)),
      prop('coast_hall', 10, 6, { w: 7, h: 4, use: 'offering_box', shadow: 0 }),
      prop('coast_offering_box', 12, 10, { w: 2, use: 'offering_box', shadow: 18 }),
      prop('coast_bell_rope', 14, 10, { use: 'shrine_bell' }),
      prop('coast_komainu', 9, 11, { use: 'coast_komainu', shadow: 10 }), prop('coast_komainu', 17, 11, { use: 'coast_komainu', flip: true, shadow: 10 }),
      prop('coast_ema_0', 5, 13, { w: 2, use: 'ema_board', shadow: 26 }),
      prop('coast_omikuji', 20, 13, { use: 'fortune_stand', shadow: 12 }),
      prop('coast_fortune_rope_0', 21, 15, { w: 2, sprFn: (g) => `coast_fortune_rope_${Math.min(3, g.state.coast.tiedDay === g.day ? g.state.coast.tied : 0)}`, solid: false }),
      prop('coast_office', 18, 8, { w: 4, h: 2, use: 'coast_office', shadow: 0 }),
      prop('coast_chozuya', 5, 18, { w: 2, use: 'coast_chozuya', shadow: 24 }),
      lantern(10, 20), lantern(17, 20), lantern(10, 24), lantern(17, 24), lantern(11, 30), lantern(16, 30),
      prop('coast_torii', 11, 26, { w: 4, solid: false }),
      prop('coast_marker', 16, 37, { use: 'coast_marker', shadow: 8 }),
      ...[1, 3, 5, 7].map((x) => prop('coast_rail', x, 0, { solid: false, wall: true, dy: 8 })),
      prop('coast_bench', 4, 2, { w: 2, use: 'coast_lookout', shadow: 18 }),
      prop('town_bush', 8, 4), prop('town_bush_flower', 1, 12, { solid: false }),
    ],
    warps: [{ x: 12, y: 39, w: 4, enter: 'down', to: 'town:from_shrine' }],
    spawns: { default: [13, 22, 'up'], from_town: [13, 37, 'up'] },
    spots: { offering_box: [13, 11], ema_board: [6, 14], fortune_stand: [20, 14], steps: [13, 33], lookout: [5, 3], forest_path: [2, 10], torii: [13, 27], office: [19, 10] },
  });
}

// =============================== LIGHTHOUSE (16x30, three floors joined by stairs) ===============================
{
  const rows = [
    '############RRRv',
    ...Array.from({ length: 7 }, (_, i) => (i === 3 ? '#ddddddddddgggRv' : '#dddddddddd#ggRv')),
    '##SS########RRRv',
    '##SS############',
    ...Array.from({ length: 8 }, () => '#ffffffffffffff#'),
    '############SS##',
    '############SS##',
    ...Array.from({ length: 9 }, () => '#wwwwwwwwwwwwww#'),
    '#######DD#######',
  ];
  const deco = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'g') deco.push({ spr: 'coast_grate', x, y, wall: true, solid: false }); if (c === 'R') deco.push({ spr: 'coast_grate', x, y, wall: true, solid: false }, { spr: 'coast_lh_rail', x, y, solid: false }); }));
  coastMap('lighthouse', {
    name: 'The Star Lantern', indoor: true, music: 'night', bg: '#1e1624',
    legend: { '#': 'coast_lh_wall', 'd': 'wood_dark', 'f': 'wood', 'w': 'wood', 'S': 'wood_dark', 'g': 'coast_grate', 'R': 'coast_railtile', 'v': 'coast_void', 'D': 'doorway' },
    rows,
    objects: [
      ...deco,
      { spr: 'coast_lh_window', x: 2, y: 0, w: 2, wall: true, solid: false }, { spr: 'coast_lh_window', x: 7, y: 0, w: 2, wall: true, solid: false },
      prop('coast_lens', 5, 4, { w: 3, use: 'lantern_lamp', soon: 'The great lens of the Star Lantern, dusty and dark. Seven empty settings ring its frame.', soonLabel: 'The great lens', sprFn: (g) => (g.flag('lantern_lit') ? 'coast_lens_lit' : 'coast_lens'), light: { kind: 'lamp', when: 'flag:lantern_lit', y: -24 }, shadow: 26 }),
      { x: 13, y: 4, w: 1, h: 1, solid: false, use: 'coast_balcony' },
      { spr: 'coast_lh_stairs', x: 2, y: 8, w: 2, h: 2, flat: true, solid: false },
      { spr: 'coast_lh_stairs', x: 12, y: 18, w: 2, h: 2, flat: true, solid: false },
      // middle floor: store room
      { spr: 'coast_porthole', x: 6, y: 9, wall: true, solid: false, dx: 2, dy: -4, use: 'coast_porthole' }, { spr: 'coast_porthole', x: 11, y: 9, wall: true, solid: false, dx: 2, dy: -4, use: 'coast_porthole' },
      { spr: 'coast_chart', x: 8, y: 9, w: 2, wall: true, solid: false, dy: -4, use: 'coast_chart' },
      prop('coast_oil_shelf', 4, 10, { w: 2 }), prop('coast_foghorn', 13, 11, { use: 'coast_foghorn', shadow: 14 }),
      prop('coast_barrel', 1, 15), prop('coast_barrel', 2, 16), prop('coast_crates', 14, 15), prop('coast_rope', 9, 15, { solid: false }), prop('coast_net', 5, 16, { w: 2, solid: false }),
      // ground floor: keeper's room
      prop('coast_logdesk', 2, 21, { w: 2, use: 'logbook', soon: 'The keeper\'s logbook, its last page dated twenty years ago.', soonLabel: 'Logbook', light: { kind: 'candle', y: -6 }, shadow: 20 }),
      { spr: 'coast_coat_hook', x: 5, y: 19, wall: true, solid: false, dy: 10, use: 'coast_coat' },
      { spr: 'coast_porthole', x: 9, y: 19, wall: true, solid: false, dx: 2, dy: -4, use: 'coast_porthole' },
      prop('coast_stove', 7, 21, { use: 'coast_stove', light: { kind: 'lantern', y: -4 }, shadow: 10 }),
      prop('coast_keeper_bed', 1, 26, { h: 2 }), prop('coast_nightstand', 3, 27),
      prop('coast_rug', 7, 24, { w: 3, h: 2, flat: true, solid: false }), prop('coast_barrel', 14, 27), prop('coast_chair', 6, 22, { solid: false }),
    ],
    warps: [{ x: 7, y: 29, w: 2, to: 'beach:from_lighthouse' }],
    spawns: { default: [7, 28, 'up'], from_beach: [7, 28, 'up'] },
    spots: { door: [7, 28], stairs: [12, 20], lamp_room: [4, 6], balcony: [12, 4], logbook: [3, 23] },
  });
}

// =============================== SUNNY PINES (26x16) ===============================
{
  const top = '#kkkkkkk#cccccccc#rrrrrrr#';
  const low = '#kkkkkkk#wwwwwwww#GGGGGGG#';
  const rows = ['##########################'];
  for (let y = 1; y <= 6; y++) rows.push(y === 3 ? top.slice(0, 8) + 'D' + top.slice(9) : y === 4 ? top.slice(0, 17) + 'D' + top.slice(18) : top);
  rows.push('#kkkkkkk####DD############');
  for (let y = 8; y <= 14; y++) rows.push(y === 11 ? low.slice(0, 8) + 'D' + low.slice(9, 17) + 'D' + low.slice(18) : low);
  rows.push('############DD############');
  coastMap('sunny_pines', {
    name: 'Sunny Pines', indoor: true, music: 'home', bg: '#1e1624',
    legend: { '#': 'wall', 'k': 'kitchen', 'c': 'carpet_green', 'r': 'wood', 'w': 'wood', 'G': 'grass', 'D': 'doorway' },
    rows,
    objects: [
      { spr: 'coast_window', x: 3, y: 0, w: 2, wall: true, solid: false, dy: -2 }, { spr: 'coast_window', x: 19, y: 0, w: 2, wall: true, solid: false, dy: -2 },
      { spr: 'coast_photos', x: 22, y: 0, w: 2, wall: true, solid: false, dy: -8, use: 'coast_photos' },
      { spr: 'coast_clock', x: 10, y: 7, wall: true, solid: false, dy: -6 },
      // dining room
      prop('coast_counter', 1, 1, { w: 3, use: 'coast_lunch', shadow: 0 }), prop('coast_tea_cart', 6, 1, { use: 'coast_tea', shadow: 12 }),
      prop('coast_dining_table', 2, 5, { w: 3, shadow: 40 }), prop('coast_chair', 1, 5, { solid: false }), prop('coast_chair', 5, 5, { solid: false, flip: true }),
      prop('coast_dining_table', 2, 10, { w: 3, shadow: 40 }), prop('coast_chair', 1, 10, { solid: false }), prop('coast_chair', 5, 10, { solid: false, flip: true }),
      prop('coast_plant', 7, 13), prop('coast_plant', 1, 13),
      // lounge
      prop('coast_shelf', 9, 1, { use: 'coast_albums' }), prop('coast_piano', 13, 1, { w: 2, use: 'coast_piano', shadow: 24 }),
      prop('coast_shogi', 11, 3, { use: 'coast_shogi', shadow: 14 }), prop('coast_armchair', 10, 3, { solid: false }), prop('coast_armchair', 12, 3, { solid: false, flip: true }),
      prop('coast_tv', 15, 5, { w: 2, use: 'coast_tv', light: { kind: 'screen', y: -12 }, shadow: 20 }), prop('coast_pines_sofa', 13, 6, { w: 2, solid: false, dy: 6 }),
      prop('coast_plant', 16, 1),
      // Grandma's room
      prop('coast_pines_bed', 23, 1, { w: 2, h: 2 }), prop('coast_nightstand', 22, 1),
      prop('coast_rug', 19, 3, { w: 3, h: 2, flat: true, solid: false }),
      prop('coast_armchair', 22, 4, { flip: true }), prop('coast_plant', 18, 1),
      // lobby
      prop('coast_reception', 9, 9, { w: 3, use: 'coast_guestbook', shadow: 34 }), prop('coast_fishtank_0', 14, 8, { w: 2, sprFn: (g) => `coast_fishtank_${Math.floor(g.clock) % 2}`, use: 'coast_fishtank', shadow: 24 }),
      prop('coast_pines_sofa', 14, 12, { w: 3, solid: true }), prop('coast_plant', 9, 14, { use: 'coast_plant' }), prop('coast_plant', 16, 14),
      // garden
      prop('coast_bench', 19, 10, { w: 2, use: 'bench', shadow: 18 }), prop('coast_bench', 22, 13, { w: 2, use: 'bench', shadow: 18 }),
      prop('town_flowerbed', 22, 8, { w: 2, solid: false }), prop('town_flowerbed', 18, 13, { w: 2, solid: false }), prop('town_tree_sakura_s', 24, 10), prop('town_bush_flower', 18, 9),
    ],
    warps: [{ x: 12, y: 15, w: 2, to: 'park:from_sunny_pines' }],
    spawns: { default: [12, 13, 'up'], from_park: [12, 14, 'up'] },
    spots: { hana_chair: [21, 4], lounge: [12, 5], garden_bench: [19, 11], dining: [5, 7], desk: [10, 10] },
  });
}

features('Coast & tides', [
  'Harbour and fish market map: pier over the water, Bait & Tackle, market stalls, the fisheries co-op, noodle stand and Theo\'s mural',
  'Captain Jun\'s boat, the Sayori, moored at the dock',
  'Shell Beach map: dunes, sand, rocks, driftwood, a bonfire pit and the headland with the lighthouse',
  'Beach umbrellas, towels and a shaved-ice stand appear in summer',
  'Tidepool cave map, reached through the cliff at low tide',
  'The Star Lantern stands dark on the headland until the lantern is lit, then it glows',
  'Harbour lamps and the noodle stand\'s paper lanterns light up at dusk',
]);
features('Shrine', [
  'Hoshi Hill Shrine map: stone steps, vermilion torii, shrine hall, guardian statues and a forest path to the lookout',
  'Stone lanterns along the shrine path are lit at dusk',
  'Sakura, maple and pine trees on the hill change with the seasons',
]);
features('Lighthouse & Sunny Pines', [
  'The Star Lantern interior: keeper\'s room, store room and the lamp room with the great lens and a balcony',
  'Sunny Pines map: lounge, dining room, lobby, Grandma\'s room and a garden with benches',
]);
