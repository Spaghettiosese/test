// The people of the wilds: farmers, toll guards, hunters, a witch, bandits, a hermit, the last
// survivor of Cinderwick. Same schedule format as the town roster.
import { S, RT, WD, villager, guardSpec, CLOTH } from './roster.js';
import { buildDuchyRoster } from './roster_duchy.js';

export const banditSpec = (o = {}) => ({ outfit: 'rogue', hood: o.hood ?? false, skin: o.skin || 'fair', hair: { style: o.hairStyle || 'short', color: o.hair || 'brown' }, beard: o.beard, mustache: o.mustache, scar: o.scar, colors: { cloth: o.cloth || '#4a3f2f', cloth2: o.cloth2 || '#2c2620', leather: o.leather || '#3a2a1c', hose: '#2a2622' }, weapon: o.weapon || 'sword', height: o.height || 1, build: o.build || 1, voice: o.voice || 0.85 });

export function buildWildsRoster(R) {
  const add = (d) => { R.push(d); return d; };
  const v = (id, name, pos, sched, o = {}) => add({ id, name, role: 'villager', pos, yaw: o.yaw ?? 0, schedule: sched, hp: o.hp || 30, dialogue: o.dialogue, loot: o.loot, spec: villager(o) });
  // ------------------------------------------------------------------ Tolliver Farms
  v('tolliver', 'Farmer Tolliver', [58, -128], [RT(6, 18, 'farm_loop', { speed: 0.9, pause: 5 }), S(18, 21, 'farm_hearth', 'warm'), S(21, 6, 'bed_barn_0', 'sleep')], { cloth: '#5a4a34', hair: 'grey', beard: 'short', cap: true, build: 1.1, dialogue: 'tolliver', voice: 0.85, loot: [['gold', 14]] });
  v('maren', 'Maren Tolliver', [33, -141], [S(6, 12, 'farm_hearth', 'cook'), S(12, 17, 'well_farm', 'stand'), S(17, 21, 'sit_farm', 'eat'), S(21, 6, 'bed_farm', 'sleep')], { outfit: 'woman', cloth: '#6a5a4a', cloth2: '#c8c0b0', apron: true, hair: 'auburn', dialogue: 'maren', voice: 1.15 });
  v('hand_a', 'Farmhand', [82, -126], [S(5, 19, 'field_a', 'work'), S(19, 21, 'barn_work', 'stand'), S(21, 5, 'bed_barn_1', 'sleep')], { cloth: CLOTH[1], hair: 'red', cap: true, dialogue: 'farmhand', voice: 0.95 });
  v('hand_b', 'Farmhand', [80, -100], [S(5, 19, 'field_b', 'work'), S(19, 21, 'barn_hay', 'stand'), S(21, 5, 'bed_barn_2', 'sleep')], { cloth: CLOTH[6], hair: 'black', dialogue: 'farmhand', voice: 0.8 });
  // ------------------------------------------------------------------ Greywater Bridge
  const tg = (id, name, pos, yaw, sched, o = {}) => add({ id, name, role: 'guard', pos, yaw, schedule: sched, spec: guardSpec({ tabard: '#3a3a2a', ...o }), hp: o.hp, dialogue: o.dialogue, loot: o.loot, eyes: o.eyes });
  tg('bosk', 'Toll Captain Bosk', [12, -212], 180, [S(6, 21, 'toll_desk', 'stand'), S(21, 6, 'bed_toll_0', 'sleep')], { hair: 'grey', beard: 'long', build: 1.12, hp: 90, dialogue: 'bosk', loot: [['tollkey', 1], ['gold', 30]] });
  tg('toll_n', 'Toll Guard', [2.2, -216], 180, [S(0, 24, 'toll_post_n', 'guard')], { hair: 'brown', dialogue: 'tollguard' });
  tg('toll_s', 'Bridge Sentry', [-2.2, -236], 0, [S(0, 24, 'toll_post_s', 'guard')], { hair: 'black', weapon: 'crossbow', eyes: 1.15 });
  tg('toll_p', 'Bridge Patrol', [0, -240], 0, [RT(0, 24, 'bridge_beat', { pause: 3 })], { hair: 'blond', beard: 'short' });
  // ------------------------------------------------------------------ the road
  v('gil', 'Gil the Peddler', [2, -100], [RT(6, 19, 'road_walk', { speed: 0.8, pause: 8 }), S(19, 6, 'ws_road', 'stand')], { cloth: '#5a3a4a', hair: 'red', hood: true, build: 1.05, dialogue: 'gil', voice: 1.1 });
  v('pilgrim_a', 'Pilgrim', [5, -92], [RT(6, 19, 'pilgrim_route', { speed: 0.85, pause: 6 }), S(19, 6, 'ws_mire', 'stand')], { cloth: '#4a4a52', hood: true, hair: 'grey', dialogue: 'pilgrim', voice: 0.9 });
  v('hermit', 'Hermit Oswin', [-70, -97], [S(0, 24, 'ws_mire', 'warm')], { cloth: '#3a3a30', hood: true, hair: 'white', beard: 'long', skin: 'sallow', height: 0.96, dialogue: 'hermit', voice: 0.8 });
  // ------------------------------------------------------------------ the Mirewood
  v('wulf', 'Hunter Wulf', [-128, -71], [S(5, 10, 'lodge_yard', 'stand'), RT(10, 18, 'hunt_loop', { speed: 1.0, pause: 4 }), S(18, 22, 'sit_lodge', 'eat'), S(22, 5, 'bed_lodge', 'sleep')], { cloth: '#3c4a34', cloth2: '#2a3024', hair: 'brown', beard: 'long', hood: true, build: 1.1, dialogue: 'wulf', voice: 0.75, loot: [['gold', 16]] });
  v('sable', 'Old Sable', [-204, 93], [S(6, 20, 'witch_table', 'work'), S(20, 1, 'witch_fire', 'warm'), S(1, 6, 'bed_witch', 'sleep')], { outfit: 'woman', cloth: '#2a2438', cloth2: '#4a3a5a', hair: 'white', hairStyle: 'long', skin: 'sallow', height: 0.95, dialogue: 'sable', voice: 1.3, hp: 60, loot: [['hexbane', 2], ['gold', 50]] });
  // bandits: hostile from the start, a leader, sleepers, sentries
  const bandit = (id, name, pos, sched, o = {}) => add({ id, name, role: 'bandit', pos, yaw: o.yaw ?? 0, schedule: sched, hostile: true, hp: o.hp ?? 55, dmg: o.dmg ?? 0.95, block: o.block ?? 0.22, eyes: o.eyes ?? 1.0, loot: o.loot || [], weapon: o.weapon, spec: banditSpec(o) });
  const bc = [-172, 14];
  bandit('cael', 'Red Cael', [bc[0] + 2, bc[1] + 3], [S(6, 22, 'bandit_seat_0', 'drink'), S(22, 6, 'bed_bandit_0', 'sleep')], { hair: 'red', beard: 'long', scar: true, build: 1.14, height: 1.05, hp: 120, dmg: 1.25, block: 0.4, weapon: 'captain', voice: 0.7, loot: [['gold', 90], ['tollkey', 1], ['ring', 1], ['leathers', 1], ['wolftooth', 1]] });
  const bl = [['Bandit Rook', 'brown', 'sword'], ['Bandit Dorn', 'black', 'mace'], ['Bandit Ivo', 'blond', 'spear'], ['Bandit Skarn', 'grey', 'sword'], ['Bandit Pell', 'red', 'dagger'], ['Bandit Yorl', 'black', 'mace']];
  bl.forEach(([name, hair, weapon], i) => {
    const seat = 'bandit_seat_' + (i + 1 < 6 ? i + 1 : 5);
    if (i < 3) bandit('bandit_' + i, name, [bc[0] + 3 + i, bc[1] + 2], [S(6, 22, seat, i % 2 ? 'drink' : 'eat'), S(22, 6, 'bed_bandit_' + (i + 1), 'sleep')], { hair, weapon, beard: i % 2 ? 'short' : undefined, loot: [['gold', 8 + i * 4], ['scrap', 1 + (i % 2)]].concat(i === 1 ? [['ironcap', 1]] : []) });
    else if (i === 3) bandit('bandit_3', name, [bc[0] + 14, bc[1] + 12], [S(0, 24, 'bandit_lookout', 'guard')], { hair, weapon, eyes: 1.25, loot: [['gold', 14]] });
    else if (i === 4) bandit('bandit_4', name, [bc[0] - 15, bc[1] - 4], [RT(0, 24, 'bandit_patrol', { pause: 3, speed: 1.05 })], { hair, weapon, loot: [['gold', 10], ['potion', 1]] });
    else bandit('bandit_5', name, [bc[0] - 15, bc[1] - 2], [S(0, 24, 'bandit_gate', 'guard')], { hair, weapon, loot: [['gold', 9]] });
  });
  // ------------------------------------------------------------------ Cinderwick
  add({ id: 'lamplighter', name: 'Lamplighter Fenn', role: 'villager', pos: [0, 24], yaw: 0, hp: 25, dialogue: 'lamplighter', schedule: [RT(18.4, 21, 'lamp_route', { speed: 0.9, pause: 2 }), RT(5.4, 6.8, 'lamp_route', { speed: 0.9, pause: 2 }), S(21, 5.4, 'well', 'stand'), S(6.8, 18.4, 'well', 'stand')], spec: villager({ cloth: '#4a3a2a', cloth2: '#2a2018', hood: false, hair: 'grey', cap: true, voice: 0.9 }) });
  v('ilse', 'Ilse', [152, 94], [S(0, 24, 'cinder_well', 'stand')], { outfit: 'woman', cloth: '#3a3038', cloth2: '#2a2228', hood: true, hair: 'black', hairStyle: 'long', skin: 'sallow', dialogue: 'ilse', voice: 1.2, hp: 22 });
  buildDuchyRoster(R);
}
