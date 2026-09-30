// The people of the new places: Fort Greywatch, Pellmouth and Stonehollow.
import { S, RT, villager, guardSpec } from './roster.js';

export function buildDuchyRoster(R) {
  const add = (d) => { R.push(d); return d; };
  const v = (id, name, pos, sched, o = {}) => add({ id, name, role: 'villager', pos, yaw: o.yaw ?? 0, schedule: sched, hp: o.hp || 30, dialogue: o.dialogue, loot: o.loot, spec: villager(o) });
  const g = (id, name, pos, yaw, sched, o = {}) => add({ id, name, role: 'guard', pos, yaw, schedule: sched, spec: guardSpec(o), hp: o.hp, dmg: o.dmg, block: o.block, weapon: o.weapon, loot: o.loot, dialogue: o.dialogue, eyes: o.eyes });
  // ---- Fort Greywatch
  g('brask', 'Sergeant Brask', [20, -106], 180, [S(6, 21, 'fort_parade', 'stand'), S(21, 6, 'bed_fort_0', 'sleep')], { hair: 'grey', beard: 'short', build: 1.12, hp: 100, dmg: 1.2, block: 0.35, dialogue: 'brask', loot: [['gaolkey', 1], ['gold', 40], ['watchhelm', 1]], weapon: 'captain' });
  g('fort_gl', 'Fort Guard', [12.6, -111.2], 270, [S(0, 24, 'fort_gate_l', 'guard')], { hair: 'brown', dialogue: 'fortguard' });
  g('fort_gr', 'Fort Guard', [12.6, -106.8], 270, [S(0, 24, 'fort_gate_r', 'guard')], { hair: 'black', beard: 'short', dialogue: 'fortguard' });
  g('fort_y1', 'Yard Guard', [14, -106], 0, [RT(0, 24, 'fort_yard', { pause: 3 })], { hair: 'blond' });
  g('fort_y2', 'Sparring Guard', [27.4, -103.4], 270, [S(6, 20, 'fort_spar_a', 'stand'), S(20, 6, 'bed_fort_1', 'sleep')], { hair: 'red' });
  g('fort_y3', 'Sparring Guard', [27.4, -106.4], 270, [S(6, 20, 'fort_spar_b', 'stand'), S(20, 6, 'bed_fort_2', 'sleep')], { hair: 'brown', beard: 'long' });
  g('fort_r1', 'Road Patrol', [2, -110], 0, [RT(6, 22, 'road_patrol', { pause: 4, speed: 1.3 }), S(22, 6, 'fort_parade', 'stand')], { hair: 'grey' });
  g('fort_r2', 'Road Crossbowman', [1, -98], 0, [RT(6, 22, 'road_patrol', { pause: 5, speed: 1.2 }), S(22, 6, 'fort_parade', 'stand')], { hair: 'black', weapon: 'crossbow', eyes: 1.2 });
  // ---- Pellmouth
  v('ode', 'Harbourmaster Ode', [150.4, -152.6], [S(6, 20, 'pell_dock', 'stand'), S(20, 6, 'bed_pell_a', 'sleep')], { cloth: '#3a4a5a', hair: 'grey', beard: 'long', cap: true, build: 1.1, dialogue: 'ode', voice: 0.8 });
  v('fisher_1', 'Fisherman Bren', [181.4, -155], [S(5, 19, 'fish_pier', 'stand'), S(19, 22, 'pell_seat_1', 'drink'), S(22, 5, 'bed_pell_b', 'sleep')], { cloth: '#4a5a4a', hair: 'brown', cap: true, dialogue: 'fisher', voice: 0.85 });
  v('fisher_2', 'Fisherwoman Tove', [153.4, -186], [S(5, 19, 'fish_shore_a', 'stand'), S(19, 22, 'pell_seat_3', 'drink'), S(22, 5, 'bed_pell_c', 'sleep')], { outfit: 'woman', cloth: '#5a4a3a', cloth2: '#c8c0b0', hair: 'auburn', dialogue: 'fisher', voice: 1.1 });
  v('fisher_3', 'Old Pellan', [153.4, -143], [S(5, 19, 'fish_shore_b', 'stand'), S(19, 23, 'pell_seat_5', 'eat'), S(23, 5, 'bed_inn_1', 'sleep')], { cloth: '#5a5a4a', hair: 'white', beard: 'long', height: 0.97, dialogue: 'fisher', voice: 0.8 });
  v('marl', 'Innkeeper Marl', [143.5, -165.4], [S(9, 1, 'inn_bar', 'stand'), S(1, 9, 'bed_inn_0', 'sleep')], { cloth: '#6a4a3a', apron: true, hair: 'black', beard: 'short', build: 1.15, dialogue: 'marl', voice: 0.9 });
  // ---- Stonehollow
  v('garrick', 'Foreman Garrick', [-233, 122], [S(6, 19, 'mine_foreman', 'stand'), S(19, 22, 'mine_seat', 'sit'), S(22, 6, 'bed_mine_0', 'sleep')], { cloth: '#4a4a52', hair: 'red', beard: 'long', build: 1.15, dialogue: 'garrick', voice: 0.7, loot: [['pickaxe', 1], ['gold', 20]] });
  v('miner_1', 'Miner Dovid', [-242.6, 124.5], [S(6, 19, 'mine_work_0', 'work'), S(19, 22, 'mine_foreman', 'stand'), S(22, 6, 'bed_mine_1', 'sleep')], { cloth: '#3a3a42', hair: 'black', dialogue: 'miner', voice: 0.9 });
  v('miner_2', 'Miner Halla', [-232.7, 137], [S(6, 19, 'mine_work_1', 'work'), S(19, 22, 'mine_foreman', 'stand'), S(22, 6, 'bed_mine_2', 'sleep')], { outfit: 'woman', cloth: '#4a4252', cloth2: '#8a8070', hair: 'brown', dialogue: 'miner', voice: 1.1 });
}
