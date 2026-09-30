// Who lives in Hollowmere and how they spend their day and night. Hours are game hours;
// a schedule entry is { h0, h1, poi | route | wander, act }.
const S = (h0, h1, poi, act, more = {}) => ({ h0, h1, poi, act, ...more });
const RT = (h0, h1, route, more = {}) => ({ h0, h1, route, act: 'patrol', ...more });
const WD = (h0, h1, wander, more = {}) => ({ h0, h1, wander, act: 'wander', ...more });

const CLOTH = ['#5a4a3c', '#4a4f3c', '#5c3d3d', '#3d4a5c', '#6a5a3a', '#4d3d5a', '#57493a', '#3f4a44'];
const TOWN_TABARD = '#6c2226', KEEP_TABARD = '#2a1620', CAPTAIN_TABARD = '#1a0e14';
const guardSpec = (o = {}) => ({ outfit: 'guard', skin: o.skin || 'fair', hair: { style: 'short', color: o.hair || 'brown' }, beard: o.beard, colors: { tabard: o.tabard || TOWN_TABARD }, weapon: o.weapon || 'sword', height: o.height || 1, build: o.build || 1, voice: o.voice || 0.9, scar: o.scar });
const villager = (o) => ({ outfit: o.outfit || 'peasant', skin: o.skin || 'fair', hair: { style: o.hairStyle || 'short', color: o.hair || 'brown' }, beard: o.beard, mustache: o.mustache, colors: { cloth: o.cloth || CLOTH[0], cloth2: o.cloth2 || '#3a2f28', leather: o.leather, hose: o.hose }, apron: o.apron, cap: o.cap, hood: o.hood, height: o.height || 1, build: o.build || 1, voice: o.voice || 1, weapon: null, scarf: o.scarf });

export function buildRoster() {
  const R = [];
  const add = (d) => { R.push(d); return d; };
  // ------------------------------------------------------------------ the town watch
  const g = (id, name, pos, yaw, sched, o = {}) => add({ id, name, role: 'guard', pos, yaw, schedule: sched, spec: guardSpec(o), hp: o.hp, dmg: o.dmg, block: o.block, loot: o.loot, dialogue: o.dialogue, eyes: o.eyes });
  g('gate_l', 'Gate Guard Berrin', [-3.2, 14.6], 0, [S(0, 24, 'gate_post_l', 'guard')], { beard: 'short', hair: 'brown', voice: 0.85 });
  g('gate_r', 'Gate Guard Osk', [3.2, 14.6], 0, [S(0, 24, 'gate_post_r', 'guard')], { hair: 'black', voice: 0.8, dialogue: 'gateguard' });
  g('street_1', 'Watchman Corm', [0, 20], 0, [RT(0, 24, 'street_beat')], { hair: 'blond', voice: 0.95 });
  g('street_2', 'Watchman Dale', [0, 30], 0, [RT(0, 24, 'gate_beat')], { beard: 'short', hair: 'grey', voice: 0.8 });
  g('plaza_1', 'Watchman Piet', [-6, 52], 0, [RT(0, 24, 'plaza_beat', { pause: 4 })], { hair: 'red', voice: 1.0 });
  g('north_1', 'Watchman Ulf', [0, 84], 0, [RT(0, 24, 'north_gate_beat')], { hair: 'black', beard: 'short' });
  g('grave_1', 'Graveyard Watch', [-40, 66], 0, [S(6, 20, 'sit_watch_0', 'sit'), RT(20, 6, 'graveyard_beat', { speed: 1.0 })], { hair: 'brown', voice: 0.85 });
  g('wall_e', 'Wall Watch East', [44, 20], 0, [RT(0, 24, 'wall_east', { pause: 4 })], { hair: 'grey', beard: 'long' });
  g('wall_w', 'Wall Watch West', [-44, 80], 0, [RT(0, 24, 'wall_west', { pause: 4 })], { hair: 'blond' });
  g('watch_a', 'Off-duty Watchman', [-14, 21], 0, [S(17, 21.5, 'sit_watch_1', 'eat'), S(21.5, 5.5, 'bed_watch_0', 'sleep'), S(5.5, 17, 'watch_table', 'stand')], { hair: 'brown' });
  g('watch_b', 'Off-duty Watchman', [-12, 21], 0, [S(17, 22, 'sit_watch_2', 'eat'), S(22, 6, 'bed_watch_1', 'sleep'), S(6, 17, 'watch_table', 'stand')], { hair: 'black', scar: true });
  // ------------------------------------------------------------------ Ravenspire's garrison
  const k = (id, name, pos, yaw, sched, o = {}) => g(id, name, pos, yaw, sched, { tabard: KEEP_TABARD, ...o });
  k('kgate_l', 'Gatehouse Guard', [-2.2, 89.2], 0, [S(0, 24, 'keepgate_l', 'guard')], { hair: 'black', beard: 'short', build: 1.05 });
  k('kgate_r', 'Gatehouse Guard', [2.2, 89.2], 0, [S(0, 24, 'keepgate_r', 'guard')], { hair: 'brown', build: 1.05, dialogue: 'keepgateguard' });
  k('kgate_in', 'Portcullis Warden', [2.2, 99], 180, [S(0, 24, 'keepgate_in_r', 'guard')], { hair: 'grey', beard: 'long' });
  k('court_a', 'Courtyard Guard', [-12, 100], 0, [RT(0, 24, 'court_beat_a')], { hair: 'brown' });
  k('court_b', 'Courtyard Guard', [-30, 116], 0, [RT(0, 24, 'court_beat_b', { pause: 3 })], { hair: 'blond', beard: 'short' });
  k('court_c', 'Courtyard Guard', [0, 96], 0, [RT(0, 24, 'court_beat_c', { pause: 3 })], { hair: 'red' });
  k('court_d', 'Courtyard Guard', [22, 112], 0, [S(6, 18, 'spar_a', 'stand'), RT(18, 6, 'court_beat_d')], { hair: 'black' });
  k('spar_1', 'Training Guard', [24, 124], 90, [S(6, 18, 'spar_b', 'stand'), S(18, 20, 'bar_door', 'stand'), S(20, 6, 'bed_bar_0', 'sleep')], { hair: 'brown' });
  k('rampart_n', 'Rampart Sentry', [-30, 153], 0, [RT(0, 24, 'rampart_north', { sentry: true, y: 6.6, speed: 0.9, pause: 3 })], { hair: 'grey', eyes: 1.2 });
  k('rampart_w', 'Rampart Sentry', [-36, 100], 0, [RT(0, 24, 'rampart_west', { sentry: true, y: 6.6, speed: 0.9, pause: 3 })], { hair: 'black', eyes: 1.2 });
  k('rampart_e', 'Rampart Sentry', [36, 146], 0, [RT(0, 24, 'rampart_east', { sentry: true, y: 6.6, speed: 0.9, pause: 3 })], { hair: 'blond', eyes: 1.2 });
  for (let i = 0; i < 3; i++) k('barr_' + i, 'Off-duty Guard', [-30 + i, 102], 0, [S(17, 21, ['bar_seat_59_1', 'bar_seat_55_1', 'bar_seat_59_0'][i], 'eat'), S(21, 5.5, 'bed_bar_' + (i + 2), 'sleep'), S(5.5, 17, 'bar_door', 'stand')], { hair: ['black', 'brown', 'red'][i] });
  k('hall_1', 'Hall Guard', [0, 114], 0, [S(0, 24, 'hall_door_in', 'guard')], { hair: 'brown', beard: 'short' });
  k('hall_2', 'Hall Guard', [-6, 118], 0, [RT(0, 24, 'hall_beat', { pause: 3 })], { hair: 'grey' });
  k('ante_1', 'Antechamber Guard', [-5.6, 137.5], 90, [S(0, 24, 'ante_l', 'guard')], { hair: 'black', beard: 'short', build: 1.1, hp: 75 });
  k('ante_2', 'Antechamber Guard', [2.6, 137.5], 270, [S(0, 24, 'ante_r', 'guard')], { hair: 'brown', build: 1.1, hp: 75 });
  k('gr_1', 'Guardroom Sentry', [14, 131], 180, [S(18, 24, 'gr_seat_0', 'eat'), S(0, 6, 'bed_grd_0', 'sleep'), S(6, 18, 'gr_watch', 'guard')], { hair: 'blond' });
  add({ id: 'harl', name: 'Captain Harl', role: 'captain', pos: [0, 118], yaw: 0, hp: 120, dmg: 1.25, block: 0.4, eyes: 1.15, loot: [['chamberkey', 1], ['keepkey', 1], ['gold', 40], ['potion', 1]],
    spec: { outfit: 'captain', skin: 'tan', hair: { style: 'short', color: 'grey' }, beard: 'short', colors: { tabard: CAPTAIN_TABARD, cape: '#1a0e14' }, weapon: 'captain', height: 1.06, build: 1.12, voice: 0.7, scar: true },
    schedule: [RT(17, 24, 'hall_beat', { speed: 1.25 }), RT(0, 5, 'ante_beat', { speed: 1.2 }), S(5, 17, 'bed_grd_0', 'sleep')], dialogue: 'harl' });
  // ------------------------------------------------------------------ the household
  add({ id: 'duke', name: 'Duke Aldric Vorst', role: 'noble', pos: [-8, 130.6], yaw: 180, hp: 40, hostile: false, weapon: null, dialogue: 'duke', detail: 0.9,
    spec: { outfit: 'duke', skin: 'pale', hair: { style: 'short', color: 'white' }, beard: 'short', colors: { cloth: '#2a1a34', cloth2: '#16101c', trim: '#b8923e', fur: '#8a8478' }, height: 1.02, voice: 0.75, eyes: '#8a6a9a' },
    schedule: [S(17, 23.3, 'throne', 'talk'), S(23.3, 6, 'bed_duke', 'sleep'), S(6, 17, 'throne', 'talk')], loot: [['dukekey', 1], ['ring', 1]] });
  add({ id: 'steward', name: 'Steward Aldous', role: 'noble', pos: [-14.9, 139.6], yaw: 270, hp: 30, weapon: null, dialogue: 'steward',
    spec: { outfit: 'noble', skin: 'sallow', hair: { style: 'short', color: 'grey' }, colors: { cloth: '#3a3a4a', cloth2: '#22222c', trim: '#8a8a94' }, hat: true, cloak: false, height: 0.98, voice: 1.2, weapon: null },
    schedule: [S(0, 24, 'duke_desk', 'sit')], loot: [['studykey', 1], ['gold', 22]] });
  add({ id: 'cook', name: 'Cook Berta', role: 'villager', pos: [-15.5, 116.6], yaw: 270, hp: 30, dialogue: 'cook',
    spec: villager({ outfit: 'woman', cloth: '#6a4a3a', cloth2: '#8a7a68', apron: true, hair: 'auburn', build: 1.15, voice: 1.1 }), schedule: [S(16, 22, 'cook_stove', 'cook'), S(22, 4, 'cook_table', 'stand'), S(4, 16, 'cook_stove', 'cook')], loot: [['servantkey', 1], ['gold', 5]] });
  add({ id: 'maid', name: 'Maid Elsbeth', role: 'villager', pos: [0, 116], yaw: 0, hp: 25, dialogue: 'maid',
    spec: villager({ outfit: 'woman', cloth: '#3a3a52', cloth2: '#c8c0b0', apron: true, hair: 'black', hairStyle: 'long', scarf: false, voice: 1.25 }), schedule: [S(17, 22.5, 'hall_door_in', 'sweep'), WD(22.5, 24, 'hall_seat_', { speed: 1.1 }), S(0, 17, 'cook_table', 'stand')], });
  // ------------------------------------------------------------------ town folk
  const v = (id, name, pos, sched, o = {}) => add({ id, name, role: 'villager', pos, yaw: o.yaw ?? 0, schedule: sched, hp: o.hp || 30, dialogue: o.dialogue, loot: o.loot, spec: villager(o) });
  v('gorm', 'Old Gorm', [17.5, 26.2], [S(15, 2.5, 'tav_bar', 'stand'), S(2.5, 15, 'bed_tavern', 'sleep')], { cloth: '#5a4030', apron: true, hair: 'white', beard: 'long', height: 1.02, build: 1.2, voice: 0.75, dialogue: 'gorm', loot: [['tavernkey', 1], ['gold', 12]] });
  v('tav_1', 'Drunk Farmer', [12, 20], [S(16, 0.5, 'tav_seat_1', 'drink'), S(0.5, 16, 'bed_h_e2', 'sleep')], { cloth: CLOTH[1], hair: 'brown', beard: 'short', dialogue: 'drunk1' });
  v('tav_2', 'Mercenary', [20, 18], [S(16, 1, 'tav_seat_4', 'drink'), S(1, 16, 'bed_h_e1', 'sleep')], { cloth: '#3f3a44', hair: 'black', mustache: true, scar: true, dialogue: 'merc', voice: 0.8 });
  v('tav_3', 'Traveling Bard', [14, 17], [S(17, 1.5, 'tav_seat_6', 'drink'), S(1.5, 17, 'bed_h_e3', 'sleep')], { cloth: '#5a2a4a', hair: 'red', hairStyle: 'long', dialogue: 'bard', voice: 1.1 });
  v('tav_4', 'Tired Miller', [20, 24], [S(17.5, 23, 'tav_seat_3', 'drink'), S(23, 17.5, 'bed_h_e4', 'sleep')], { cloth: '#6a6a5a', hair: 'grey', voice: 0.9 });
  v('brandt', 'Brandt the Smith', [-14, 57.2], [S(6, 21.5, 'anvil', 'work'), S(21.5, 6, 'bed_smithy', 'sleep')], { outfit: 'smith', cloth: '#4a3a34', hair: 'black', beard: 'long', skin: 'tan', build: 1.15, height: 1.04, voice: 0.7, dialogue: 'smith', loot: [['gold', 14]] });
  v('hilde', 'Baker Hilde', [17.2, 41.5], [S(2.5, 15, 'oven', 'work'), S(15, 19, 'baker_table', 'stand'), S(19, 2.5, 'bed_baker', 'sleep')], { outfit: 'woman', cloth: '#7a6a5a', cloth2: '#d8d0c0', apron: true, hair: 'blond', voice: 1.15, dialogue: 'hilde' });
  v('edda', 'Weaver Edda', [-13.8, 33.7], [S(7, 21, 'loom', 'weave'), S(21, 7, 'bed_weaver', 'sleep')], { outfit: 'woman', cloth: '#4a3a5a', cloth2: '#8a6a4a', hair: 'grey', hairStyle: 'long', voice: 1.2 });
  v('osric', 'Osric the Cooper', [-12, 44.5], [S(7, 20, 'cooper_work', 'work'), S(20, 7, 'bed_cooper', 'sleep')], { cloth: '#5a4a34', apron: true, hair: 'brown', beard: 'short', voice: 0.9, dialogue: 'osric' });
  v('marta', 'Widow Marta', [26.5, 43], [S(6, 20, 'sit_widow', 'sit'), S(20, 22.5, 'sit_widow', 'sit'), S(22.5, 6, 'bed_widow', 'sleep')], { outfit: 'woman', cloth: '#2f2f38', cloth2: '#3a3a44', hair: 'grey', hairStyle: 'short', voice: 1.2, dialogue: 'marta', height: 0.96 });
  v('ansel', 'Father Ansel', [-28.5, 81.6], [S(17, 22.5, 'altar', 'pray'), S(22.5, 5, 'bed_priest', 'sleep'), S(5, 17, 'pray_0', 'pray')], { outfit: 'priest', cloth: '#2a2a30', robe: '#34303c', hair: 'white', hairStyle: 'tonsure', skin: 'pale', voice: 0.95, dialogue: 'ansel', loot: [['mausoleumkey', 1], ['gold', 9]], });
  v('tobbe', 'Tobbe the Sexton', [-40, 70], [WD(20, 5, 'grave_walk_', { speed: 0.9 }), S(5, 20, 'bed_h_w2', 'sleep')], { cloth: '#3a3a30', hood: true, hair: 'grey', beard: 'long', skin: 'sallow', voice: 0.8, dialogue: 'tobbe', height: 0.96, loot: [['mausoleumkey', 1]] });
  // market stalls close at eight
  const stallOwners = [['Fruit-seller Pim', 'stall_0', 'bed_h_e5', { hair: 'red', cloth: CLOTH[2] }], ['Bread-seller Jorn', 'stall_1', 'bed_h_e4', { hair: 'brown', apron: true, cloth: CLOTH[4] }], ['Potter Sanne', 'stall_2', 'bed_h_w1', { outfit: 'woman', hair: 'black', cloth: CLOTH[5] }], ['Draper Wella', 'stall_3', 'bed_h_w3', { outfit: 'woman', hair: 'grey', cloth: CLOTH[3] }], ['Fishmonger Gaet', 'stall_4', 'bed_h_e3', { hair: 'black', beard: 'short', apron: true, cloth: CLOTH[1] }], ['Herbwife Nan', 'stall_5', 'bed_h_w2', { outfit: 'woman', hair: 'white', cloth: CLOTH[0], hood: false }]];
  stallOwners.forEach(([name, stall, bed, o], i) => v('stall_' + i, name, [0, 60], [S(7, 20, stall, 'stand'), S(20, 7, bed, 'sleep')], { ...o, dialogue: 'merchant', voice: 0.9 + i * 0.05 }));
  const walkers = [['Peasant', 'bed_h_e1', { cloth: CLOTH[6], hair: 'brown' }], ['Peasant', 'bed_h_w1', { cloth: CLOTH[7], hair: 'blond', outfit: 'woman' }], ['Peasant', 'bed_h_e5', { cloth: CLOTH[3], hair: 'black', hood: true }], ['Farmhand', 'bed_h_w3', { cloth: CLOTH[1], hair: 'red', cap: true }]];
  walkers.forEach(([name, bed, o], i) => v('walker_' + i, name, [-3 + i * 2, 58 + (i % 2) * 4], [WD(6, 21, 'plaza_', { speed: 0.95 }), S(21, 6, bed, 'sleep')], { ...o, dialogue: 'peasant', voice: 0.85 + i * 0.1 }));
  v('beggar', 'Beggar', [-2, 56], [S(0, 24, 'well', 'stand')], { cloth: '#4a4238', hood: true, hair: 'grey', beard: 'long', skin: 'sallow', dialogue: 'beggar', voice: 0.85, hp: 20 });
  v('brannoch', 'Brannoch', [11.6, -31.4], [S(0, 24, 'camp_brannoch', 'warm')], { cloth: '#3f3a34', cloth2: '#2a241e', hood: true, hair: 'black', beard: 'short', skin: 'tan', dialogue: 'brannoch', voice: 0.75, leather: '#4a3222' });
  return R;
}
